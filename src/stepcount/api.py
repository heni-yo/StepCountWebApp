import os
import io
import tempfile
import json
import time
from pathlib import Path
from typing import Optional, Dict, Any
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel

from stepcount import __version__
from stepcount import utils
from stepcount.stepcount import load_model, summarize_enmo, summarize_steps, summarize_cadence, summarize_bouts, plot
from stepcount import __model_version__


# Pydantic models for request/response
class ProcessingRequest(BaseModel):
    model_type: str = "rf"
    sample_rate: Optional[int] = None
    txyz: str = "time,x,y,z"
    min_wear_per_day: float = 21 * 60
    min_wear_per_hour: float = 50
    min_wear_per_minute: float = 0.5
    min_walk_per_day: float = 5
    bouts_min_walk: float = 0.8
    bouts_max_idle: int = 3
    exclude_wear_below: Optional[str] = None
    exclude_first_last: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    calibration_stdtol_min: Optional[float] = None
    start_first_complete_minute: bool = False
    pytorch_device: str = "cpu"


class ProcessingResponse(BaseModel):
    success: bool
    message: str
    processing_time: float
    results: Optional[Dict[str, Any]] = None
    output_files: Optional[Dict[str, str]] = None


# Initialize FastAPI app
app = FastAPI(
    title="StepCount API",
    description="API for processing accelerometer data and counting steps using machine learning models",
    version=__version__,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model cache
model_cache = {}


def get_model(model_type: str, pytorch_device: str = "cpu"):
    """Get or load model from cache"""
    cache_key = f"{model_type}_{pytorch_device}"
    
    if cache_key not in model_cache:
        model_path = Path(__file__).parent / f"{__model_version__[model_type]}.joblib.lzma"
        model = load_model(str(model_path), model_type, check_md5=True, force_download=False)
        model.wd.device = pytorch_device
        model_cache[cache_key] = model
    
    return model_cache[cache_key]


def convert_pandas_to_native(obj):
    """Convert pandas objects to native Python types for JSON serialization"""
    if isinstance(obj, pd.Series):
        return obj.to_dict()
    elif isinstance(obj, pd.DataFrame):
        return obj.to_dict('records')
    elif isinstance(obj, dict):
        return {k: convert_pandas_to_native(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_pandas_to_native(item) for item in obj]
    elif hasattr(obj, 'item'):  # numpy scalars
        return obj.item()
    else:
        return obj


def process_csv_data(
    csv_data: pd.DataFrame,
    request: ProcessingRequest,
    output_dir: Path
) -> Dict[str, Any]:
    """Process CSV data and return results"""
    
    # Parse column names
    usecols = request.txyz.split(',')
    if len(usecols) != 4:
        raise ValueError("txyz must contain exactly 4 column names: time,x,y,z")
    
    # Check if all required columns exist
    missing_cols = [col for col in usecols if col not in csv_data.columns]
    if missing_cols:
        raise KeyError(f"Missing columns: {', '.join(missing_cols)}. Available columns: {', '.join(csv_data.columns)}")
    
    # Rename columns to standard format
    csv_data = csv_data.rename(columns={
        usecols[0]: 'time',
        usecols[1]: 'x', 
        usecols[2]: 'y',
        usecols[3]: 'z'
    })
    
    # Validate data types for x, y, z columns
    non_numeric_issues = []
    for col in ['x', 'y', 'z']:
        if not pd.api.types.is_numeric_dtype(csv_data[col]):
            try:
                # Try to convert to numeric, keeping track of which values fail
                original_values = csv_data[col].copy()
                csv_data[col] = pd.to_numeric(csv_data[col], errors='coerce')
                
                # Find which specific values couldn't be converted (excluding header if it was treated as data)
                failed_mask = csv_data[col].isnull() & original_values.notna()
                if failed_mask.any():
                    failed_indices = csv_data[failed_mask].index.tolist()[:5]  # Limit to first 5
                    failed_values = [str(original_values.loc[idx]) for idx in failed_indices]
                    # Adjust row numbers to be 1-based for user display (add 1 to account for 0-based indexing)
                    user_friendly_indices = [idx + 1 for idx in failed_indices]
                    non_numeric_issues.append(f"Column '{col}' has non-numeric values at rows {user_friendly_indices}: {failed_values}")
            except Exception as e:
                non_numeric_issues.append(f"Column '{col}' conversion failed: {str(e)}")
    
    if non_numeric_issues:
        error_msg = "Data type validation failed:\n" + "\n".join(non_numeric_issues)
        error_msg += "\nPlease ensure all accelerometer columns contain only numbers."
        raise ValueError(error_msg)
    
    # Check for missing values in accelerometer data
    missing_issues = []
    for col in ['x', 'y', 'z']:
        if csv_data[col].isnull().any():
            null_indices = csv_data[csv_data[col].isnull()].index.tolist()[:5]  # Limit to first 5
            # Convert to 1-based row numbers for user display
            user_friendly_indices = [idx + 1 for idx in null_indices]
            missing_issues.append(f"Column '{col}' has missing values at rows: {user_friendly_indices}")
    
    if missing_issues:
        error_msg = "Missing data found:\n" + "\n".join(missing_issues)
        error_msg += "\nPlease ensure all x, y, z values are present."
        raise ValueError(error_msg)
    
    # Convert time column to datetime if it's not already
    try:
        if not pd.api.types.is_datetime64_any_dtype(csv_data['time']):
            # Try to convert and identify specific problematic values
            original_time_values = csv_data['time'].copy()
            csv_data['time'] = pd.to_datetime(csv_data['time'], errors='coerce')
            
            # Find which specific time values couldn't be parsed
            failed_mask = csv_data['time'].isnull() & original_time_values.notna()
            if failed_mask.any():
                failed_indices = csv_data[failed_mask].index.tolist()[:5]  # Limit to first 5
                failed_values = [str(original_time_values.loc[idx]) for idx in failed_indices]
                # Convert to 1-based row numbers for user display
                user_friendly_indices = [idx + 1 for idx in failed_indices]
                error_msg = f"Unable to parse time column. Invalid timestamps found at rows {user_friendly_indices}: {failed_values}"
                error_msg += f"\nPlease ensure your time column contains valid timestamps (e.g., '2023-01-01 10:00:00.000')."
                raise ValueError(error_msg)
    except ValueError:
        # Re-raise our custom error
        raise
    except Exception as e:
        raise ValueError(f"Unable to parse time column. Please ensure your time column contains valid timestamps (e.g., '2023-01-01 10:00:00.000'). Error: {str(e)}")
    
    # Check for missing time values
    if csv_data['time'].isnull().any():
        null_indices = csv_data[csv_data['time'].isnull()].index.tolist()[:5]  # Limit to first 5
        # Convert to 1-based row numbers for user display
        user_friendly_indices = [idx + 1 for idx in null_indices]
        raise ValueError(f"Time column contains missing values at rows: {user_friendly_indices}. Please ensure all timestamps are present.")
    
    # Set time as index
    csv_data = csv_data.set_index('time')
    
    # Apply time filtering if specified
    if request.start_time and request.start_time.strip() and request.start_time.lower() != 'string':
        try:
            start_dt = pd.to_datetime(request.start_time)
            csv_data = csv_data[csv_data.index >= start_dt]
        except Exception as e:
            raise ValueError(f"Invalid start_time format: '{request.start_time}'. Please use a valid datetime format (e.g., '2023-01-01 10:00:00'). Error: {str(e)}")
    
    if request.end_time and request.end_time.strip() and request.end_time.lower() != 'string':
        try:
            end_dt = pd.to_datetime(request.end_time)
            csv_data = csv_data[csv_data.index <= end_dt]
        except Exception as e:
            raise ValueError(f"Invalid end_time format: '{request.end_time}'. Please use a valid datetime format (e.g., '2023-01-01 10:00:00'). Error: {str(e)}")
    
    # Calculate sample rate if not provided
    if request.sample_rate is None or request.sample_rate == 0:
        try:
            # First try the utils.infer_freq method
            sample_rate = utils.infer_freq(csv_data.index)
            if sample_rate is None:
                raise ValueError("infer_freq returned None")
            
            # Convert to float if it's a Timedelta
            if hasattr(sample_rate, 'total_seconds'):
                sample_rate = 1.0 / sample_rate.total_seconds()
            else:
                sample_rate = float(sample_rate)
                
            # Validate the sample rate is reasonable (between 1 and 1000 Hz)
            if sample_rate < 1 or sample_rate > 1000:
                raise ValueError(f"Unreasonable sample rate: {sample_rate}")
                
        except Exception as e:
            # If sample rate inference fails, calculate manually
            if len(csv_data) > 1:
                time_diffs = csv_data.index.to_series().diff().dropna()
                if len(time_diffs) > 0:
                    # Use median to avoid outliers
                    median_diff = time_diffs.median()
                    if pd.notna(median_diff):
                        sample_rate = 1.0 / median_diff.total_seconds()
                        # Validate the calculated sample rate
                        if sample_rate < 1 or sample_rate > 1000:
                            # If still unreasonable, try mean
                            mean_diff = time_diffs.mean()
                            if pd.notna(mean_diff):
                                sample_rate = 1.0 / mean_diff.total_seconds()
                            else:
                                sample_rate = 104  # Default for your data
                        else:
                            sample_rate = 104  # Default for your data
                    else:
                        sample_rate = 104  # Default for your data
                else:
                    sample_rate = 104  # Default for your data
            else:
                sample_rate = 104  # Default for your data
    else:
        sample_rate = request.sample_rate
    
    # Resample if needed
    if request.model_type == 'ssl':
        resample_hz = 30
    else:
        resample_hz = None
    
    if resample_hz and sample_rate != resample_hz:
        # Check if we have enough data points for resampling
        if len(csv_data) < 10:
            raise ValueError(f"Insufficient data for resampling. Need at least 10 data points, got {len(csv_data)}. Please provide more data or use a different model type.")
        
        try:
            # Use proper pandas frequency format - convert to milliseconds
            freq_ms = int(1000 / resample_hz)  # Convert to milliseconds
            freq_str = f'{freq_ms}ms'
            csv_data = csv_data.resample(freq_str).mean()
            sample_rate = resample_hz
        except Exception as e:
            raise ValueError(f"Failed to resample data to {resample_hz}Hz: {str(e)}. The data may have irregular timestamps or insufficient points.")
    
    # Calculate wear stats
    wear_stats = utils.calculate_wear_stats(csv_data)
    
    # Check minimum data requirements for Random Forest model
    if request.model_type == 'rf' and len(csv_data) < 50:
        return {
            "error": f"Insufficient data for Random Forest model. Need at least 50 data points, got {len(csv_data)}. Please provide more data or use the SSL model instead.",
            "data_points": len(csv_data),
            "minimum_required": 50
        }
    
    # Apply exclusions
    if request.exclude_first_last and request.exclude_first_last.strip() and request.exclude_first_last.lower() != 'string':
        csv_data = utils.drop_first_last_days(csv_data, request.exclude_first_last)
    
    if request.exclude_wear_below and request.exclude_wear_below.strip() and request.exclude_wear_below.lower() != 'string':
        csv_data = utils.flag_wear_below_days(csv_data, request.exclude_wear_below)
    
    # Update wear stats after exclusions
    wear_stats.update(utils.calculate_wear_stats(csv_data))
    
    # Check if we have data to process
    if len(csv_data) == 0 or csv_data[['x', 'y', 'z']].isna().any(axis=1).all():
        return {
            "error": "No valid data to process after filtering",
            "wear_stats": wear_stats
        }
    
    # Load model
    try:
        model = get_model(request.model_type, request.pytorch_device)
        
        # Ensure sample_rate is a float, not a Timedelta
        if hasattr(sample_rate, 'total_seconds'):
            sample_rate = float(sample_rate.total_seconds())
        else:
            sample_rate = float(sample_rate)
        
        # Ensure window_sec is also a float
        window_sec = float(model.window_sec) if hasattr(model, 'window_sec') else 1.0
        
        model.sample_rate = sample_rate
        model.window_len = int(np.ceil(sample_rate * window_sec))
        model.wd.sample_rate = sample_rate
        model.verbose = False
        model.wd.verbose = False
        
        # Ensure any other numeric attributes are properly converted
        if hasattr(model, 'steptol'):
            model.steptol = float(model.steptol) if model.steptol is not None else 0.0
        if hasattr(model, 'bout_min_len'):
            model.bout_min_len = int(model.bout_min_len) if model.bout_min_len is not None else 0
        if hasattr(model, 'bout_max_idle'):
            model.bout_max_idle = float(model.bout_max_idle) if model.bout_max_idle is not None else 0.0
        
        # Additional type safety for model attributes that might contain timedeltas
        for attr_name in ['window_len', 'sample_rate']:
            if hasattr(model, attr_name):
                value = getattr(model, attr_name)
                if hasattr(value, 'total_seconds'):
                    setattr(model, attr_name, float(value.total_seconds()))
                elif hasattr(value, 'dtype') and 'timedelta' in str(value.dtype):
                    setattr(model, attr_name, float(value))
                else:
                    setattr(model, attr_name, float(value))
        
        # Ensure wd attributes are also properly converted
        if hasattr(model, 'wd'):
            for attr_name in ['sample_rate', 'window_len']:
                if hasattr(model.wd, attr_name):
                    value = getattr(model.wd, attr_name)
                    if hasattr(value, 'total_seconds'):
                        setattr(model.wd, attr_name, float(value.total_seconds()))
                    elif hasattr(value, 'dtype') and 'timedelta' in str(value.dtype):
                        setattr(model.wd, attr_name, float(value))
                    else:
                        setattr(model.wd, attr_name, float(value))
    except Exception as e:
        raise ValueError(f"Failed to load {request.model_type} model: {str(e)}")
    
    # Process data
    try:
        # Ensure data is properly formatted before prediction
        # Convert any remaining timedelta64 columns to numeric
        for col in csv_data.columns:
            if csv_data[col].dtype.name.startswith('timedelta'):
                csv_data[col] = pd.to_numeric(csv_data[col], errors='coerce')
        
        # Ensure index is datetime and not timedelta
        if hasattr(csv_data.index, 'dtype') and 'timedelta' in str(csv_data.index.dtype):
            # Convert timedelta index to numeric (seconds)
            csv_data.index = pd.to_numeric(csv_data.index, errors='coerce')
        
        # Debug: Print data types before prediction
        print(f"Data types before prediction: {csv_data.dtypes}")
        print(f"Index type: {type(csv_data.index)}")
        print(f"Sample rate: {sample_rate} (type: {type(sample_rate)})")
        
        # Ensure all numeric values are proper Python types, not numpy types
        sample_rate = int(sample_rate) if sample_rate == int(sample_rate) else float(sample_rate)
        model.sample_rate = float(sample_rate)
        model.window_len = int(model.window_len)
        model.wd.sample_rate = float(sample_rate)
        
        Y, W, T_steps = model.predict_from_frame(csv_data)
    except Exception as e:
        raise ValueError(f"Model prediction failed: {str(e)}. This might be due to insufficient data or incompatible data format.")
    
    # Save step counts
    Y.to_csv(output_dir / "Steps.csv.gz")
    T_steps.to_csv(output_dir / "StepTimes.csv.gz", index=False)
    
    # Calculate summaries
    enmo_summary = summarize_enmo(
        csv_data,
        adjust_estimates=False,
        min_wear_per_day=request.min_wear_per_day,
        min_wear_per_hour=request.min_wear_per_hour,
        min_wear_per_minute=request.min_wear_per_minute
    )
    
    enmo_summary_adj = summarize_enmo(
        csv_data,
        adjust_estimates=True,
        min_wear_per_day=request.min_wear_per_day,
        min_wear_per_hour=request.min_wear_per_hour,
        min_wear_per_minute=request.min_wear_per_minute
    )
    
    steps_summary = summarize_steps(
        Y,
        model.steptol,
        adjust_estimates=False,
        min_wear_per_day=request.min_wear_per_day,
        min_wear_per_hour=request.min_wear_per_hour,
        min_wear_per_minute=request.min_wear_per_minute
    )
    
    steps_summary_adj = summarize_steps(
        Y,
        model.steptol,
        adjust_estimates=True,
        min_wear_per_day=request.min_wear_per_day,
        min_wear_per_hour=request.min_wear_per_hour,
        min_wear_per_minute=request.min_wear_per_minute
    )
    
    cadence_summary = summarize_cadence(
        Y,
        model.steptol,
        min_walk_per_day=request.min_walk_per_day,
        adjust_estimates=False
    )
    
    cadence_summary_adj = summarize_cadence(
        Y,
        model.steptol,
        min_walk_per_day=request.min_walk_per_day,
        adjust_estimates=True
    )
    
    bouts_summary = summarize_bouts(
        Y,
        csv_data,
        model.steptol,
        bouts_min_walk=request.bouts_min_walk,
        bouts_max_idle=request.bouts_max_idle
    )
    
    # Create minutely, hourly, and daily summaries
    minutely_data = csv_data.copy()
    minutely_data['Steps'] = Y
    minutely_data['ENMO(mg)'] = np.sqrt(csv_data['x']**2 + csv_data['y']**2 + csv_data['z']**2) - 1
    minutely_data = minutely_data.resample('1T').agg({
        'Steps': 'sum',
        'ENMO(mg)': 'mean'
    }).fillna(0)
    minutely_data.to_csv(output_dir / "Minutely.csv.gz")
    
    hourly_data = minutely_data.resample('1H').agg({
        'Steps': 'sum',
        'ENMO(mg)': 'mean'
    })
    hourly_data.to_csv(output_dir / "Hourly.csv.gz")
    
    daily_data = minutely_data.resample('1D').agg({
        'Steps': 'sum',
        'ENMO(mg)': 'mean'
    })
    daily_data.to_csv(output_dir / "Daily.csv.gz")
    
    # Generate plot
    plot_path = output_dir / "Steps.png"
    plot(Y, title="Step Count Analysis")
    plt.savefig(plot_path, dpi=150, bbox_inches='tight')
    plt.close()
    
    # Compile results
    results = {
        "wear_stats": convert_pandas_to_native(wear_stats),
        "enmo_summary": convert_pandas_to_native(enmo_summary),
        "enmo_summary_adjusted": convert_pandas_to_native(enmo_summary_adj),
        "steps_summary": convert_pandas_to_native(steps_summary),
        "steps_summary_adjusted": convert_pandas_to_native(steps_summary_adj),
        "cadence_summary": convert_pandas_to_native(cadence_summary),
        "cadence_summary_adjusted": convert_pandas_to_native(cadence_summary_adj),
        "bouts_summary": convert_pandas_to_native(bouts_summary),
        "total_steps": int(steps_summary['total_steps']),
        "total_walking_minutes": float(steps_summary['total_walk']),
        "average_daily_steps": float(steps_summary['avg_steps']),
        "sample_rate": sample_rate,
        "data_duration_hours": float(len(csv_data) / (sample_rate * 3600))
    }
    
    return results


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "StepCount API",
        "version": __version__,
        "docs": "/docs",
        "endpoints": {
            "upload_csv": "/upload-csv",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": __version__}


@app.post("/upload-csv", response_model=ProcessingResponse)
async def upload_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    model_type: str = Form("rf"),
    sample_rate: Optional[int] = Form(None),
    txyz: Optional[str] = Form(None),
    min_wear_per_day: Optional[float] = Form(None),
    min_wear_per_hour: Optional[float] = Form(None),
    min_wear_per_minute: Optional[float] = Form(None),
    min_walk_per_day: Optional[float] = Form(None),
    bouts_min_walk: Optional[float] = Form(None),
    bouts_max_idle: Optional[int] = Form(None),
    exclude_wear_below: Optional[str] = Form(None),
    exclude_first_last: Optional[str] = Form(None),
    start_time: Optional[str] = Form(None),
    end_time: Optional[str] = Form(None),
    calibration_stdtol_min: Optional[float] = Form(None),
    start_first_complete_minute: Optional[bool] = Form(None),
    pytorch_device: Optional[str] = Form(None)
):
    """Upload and process CSV file with accelerometer data"""
    
    start_time_processing = time.time()
    
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV file")
        
        # Create request object with defaults for None values
        request = ProcessingRequest(
            model_type=model_type,
            sample_rate=sample_rate,
            txyz=txyz or "time,x,y,z",
            min_wear_per_day=min_wear_per_day or 21 * 60,
            min_wear_per_hour=min_wear_per_hour or 50,
            min_wear_per_minute=min_wear_per_minute or 0.5,
            min_walk_per_day=min_walk_per_day or 5,
            bouts_min_walk=bouts_min_walk or 0.8,
            bouts_max_idle=bouts_max_idle or 3,
            exclude_wear_below=exclude_wear_below,
            exclude_first_last=exclude_first_last,
            start_time=start_time,
            end_time=end_time,
            calibration_stdtol_min=calibration_stdtol_min,
            start_first_complete_minute=start_first_complete_minute if start_first_complete_minute is not None else False,
            pytorch_device=pytorch_device or "cpu"
        )
        
        # Read CSV data
        content = await file.read()
        csv_data = pd.read_csv(io.BytesIO(content))
        
        # Create temporary output directory
        with tempfile.TemporaryDirectory() as temp_dir:
            output_dir = Path(temp_dir) / "outputs"
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Process data
            results = process_csv_data(csv_data, request, output_dir)
            
            if "error" in results:
                return ProcessingResponse(
                    success=False,
                    message=results["error"],
                    processing_time=time.time() - start_time_processing
                )
            
            # Create output files dictionary
            output_files = {}
            for file_path in output_dir.glob("*"):
                if file_path.is_file():
                    output_files[file_path.name] = str(file_path)
            
            processing_time = time.time() - start_time_processing
            
            return ProcessingResponse(
                success=True,
                message="Processing completed successfully",
                processing_time=processing_time,
                results=results,
                output_files=output_files
            )
    
    except ValueError as e:
        error_msg = str(e)
        if "must be real number, not Timedelta" in error_msg:
            return ProcessingResponse(
                success=False,
                message=f"Data processing error: {error_msg}. This is likely due to sample rate inference issues with the time data.",
                processing_time=time.time() - start_time_processing
            )
        elif "Timedelta" in error_msg:
            return ProcessingResponse(
                success=False,
                message=f"Data processing error: {error_msg}. This may be due to irregular timestamps or insufficient data.",
                processing_time=time.time() - start_time_processing
            )
        elif "txyz must contain exactly 4 column names" in error_msg:
            return ProcessingResponse(
                success=False,
                message="Column configuration error: Please specify exactly 4 column names in the format 'time,x,y,z' (e.g., 'timestamp,accel_x,accel_y,accel_z').",
                processing_time=time.time() - start_time_processing
            )
        else:
            return ProcessingResponse(
                success=False,
                message=f"Data validation error: {error_msg}",
                processing_time=time.time() - start_time_processing
            )
    except pd.errors.ParserError as e:
        return ProcessingResponse(
            success=False,
            message=f"CSV parsing error: Unable to parse the CSV file. Please check that your file is properly formatted with comma-separated values. Error: {str(e)}",
            processing_time=time.time() - start_time_processing
        )
    except KeyError as e:
        return ProcessingResponse(
            success=False,
            message=f"Column error: Required column not found in CSV. Please ensure your CSV contains the columns specified in 'txyz' parameter. Missing: {str(e)}",
            processing_time=time.time() - start_time_processing
        )
    except Exception as e:
        error_type = type(e).__name__
        return ProcessingResponse(
            success=False,
            message=f"Processing error ({error_type}): {str(e)}. Please check your data format and try again.",
            processing_time=time.time() - start_time_processing
        )


@app.post("/process-data", response_model=ProcessingResponse)
async def process_data(
    data: Dict[str, Any],
    request: ProcessingRequest
):
    """Process accelerometer data directly from JSON"""
    
    start_time_processing = time.time()
    
    try:
        # Convert data to DataFrame
        csv_data = pd.DataFrame(data)
        
        # Create temporary output directory
        with tempfile.TemporaryDirectory() as temp_dir:
            output_dir = Path(temp_dir) / "outputs"
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Process data
            results = process_csv_data(csv_data, request, output_dir)
            
            if "error" in results:
                return ProcessingResponse(
                    success=False,
                    message=results["error"],
                    processing_time=time.time() - start_time_processing
                )
            
            processing_time = time.time() - start_time_processing
            
            return ProcessingResponse(
                success=True,
                message="Processing completed successfully",
                processing_time=processing_time,
                results=results
            )
    
    except Exception as e:
        return ProcessingResponse(
            success=False,
            message=f"Error processing data: {str(e)}",
            processing_time=time.time() - start_time_processing
        )



# Patient management models
class Patient(BaseModel):
    id: str
    nom: str
    prenom: str
    date_naissance: str
    age: int
    sexe: str
    poids: float
    taille: float

class AccelerometerConfig(BaseModel):
    id: str
    patient_id: str
    status: str = "configured"
    created_at: str

class ExtractionData(BaseModel):
    fileSize: int
    lineCount: int
    data: str

# Mock database for patients (in production, use a real database)
patients_db = {
    "P001": {
        "id": "P001",
        "nom": "Dupont",
        "prenom": "Jean",
        "date_naissance": "1985-03-15",
        "age": 39,
        "sexe": "M",
        "poids": 75.5,
        "taille": 175.0
    },
    "P002": {
        "id": "P002", 
        "nom": "Martin",
        "prenom": "Marie",
        "date_naissance": "1990-07-22",
        "age": 34,
        "sexe": "F",
        "poids": 62.3,
        "taille": 165.0
    },
    "P003": {
        "id": "P003",
        "nom": "Bernard",
        "prenom": "Pierre",
        "date_naissance": "1978-11-08",
        "age": 46,
        "sexe": "M",
        "poids": 82.1,
        "taille": 180.0
    }
}

accelerometers_db = {}

# Patient management endpoints
@app.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    """Get patient information by ID"""
    if patient_id not in patients_db:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return patients_db[patient_id]

@app.post("/accelerometer/configure")
async def configure_accelerometer(request: dict):
    """Configure and initialize accelerometer for a patient"""
    patient_id = request.get("patient_id")
    
    if not patient_id:
        raise HTTPException(status_code=400, detail="Patient ID is required")
    
    if patient_id not in patients_db:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Generate accelerometer ID
    accelerometer_id = f"ACC_{patient_id}_{int(time.time())}"
    
    # Store accelerometer configuration
    accelerometers_db[accelerometer_id] = {
        "id": accelerometer_id,
        "patient_id": patient_id,
        "status": "configured",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    return {
        "id": accelerometer_id,
        "patient_id": patient_id,
        "status": "configured",
        "message": "Accelerometer configured and initialized successfully"
    }

@app.post("/accelerometer/extract")
async def extract_accelerometer_data(request: dict):
    """Extract CSV data from accelerometer"""
    accelerometer_id = request.get("accelerometer_id")
    
    if not accelerometer_id:
        raise HTTPException(status_code=400, detail="Accelerometer ID is required")
    
    if accelerometer_id not in accelerometers_db:
        raise HTTPException(status_code=404, detail="Accelerometer not found")
    
    # Simulate data extraction (in production, this would connect to the actual accelerometer)
    # For demo purposes, we'll return mock data
    return {
        "fileSize": 1024000,  # 1MB
        "lineCount": 50000,
        "data": "time,x,y,z\n2025-01-01 10:00:00,0.5,-0.8,0.1\n...",
        "message": "Data extracted successfully"
    }

@app.post("/patients/process-data")
async def process_patient_data(request: dict):
    """Process extracted data for a patient"""
    patient_id = request.get("patient_id")
    extraction_data = request.get("extraction_data")
    
    if not patient_id:
        raise HTTPException(status_code=400, detail="Patient ID is required")
    
    if not extraction_data:
        raise HTTPException(status_code=400, detail="Extraction data is required")
    
    if patient_id not in patients_db:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Simulate data processing (in production, this would use the actual stepcount algorithm)
    # For demo purposes, we'll return mock results
    processing_results = {
        "total_steps": 8542,
        "data_duration_hours": 8.5,
        "sample_rate": 104,
        "total_walking_minutes": 120.5,
        "average_daily_steps": 8542,
        "processing_time": 2.3
    }
    
    # In production, save results to database
    return {
        "patient_id": patient_id,
        "results": processing_results,
        "message": "Data processed and saved successfully"
    }

if __name__ == "__main__":
    uvicorn.run(
        "stepcount.api:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
