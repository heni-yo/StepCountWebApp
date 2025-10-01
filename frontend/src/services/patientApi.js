import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.detail || 'Server error';
      throw new Error(message);
    } else if (error.request) {
      throw new Error('No response from server. Please check if the API is running.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// Rechercher un patient par ID
export const searchPatient = async (patientId) => {
  try {
    const response = await api.get(`/patients/${patientId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Patient search failed: ${error.message}`);
  }
};

// Configurer et initialiser l'accéléromètre
export const configureAccelerometer = async (patientId) => {
  try {
    const response = await api.post('/accelerometer/configure', {
      patient_id: patientId
    });
    return response.data;
  } catch (error) {
    throw new Error(`Accelerometer configuration failed: ${error.message}`);
  }
};

// Extraire les données de l'accéléromètre
export const extractData = async (accelerometerId) => {
  try {
    const response = await api.post('/accelerometer/extract', {
      accelerometer_id: accelerometerId
    });
    return response.data;
  } catch (error) {
    throw new Error(`Data extraction failed: ${error.message}`);
  }
};

// Traiter les données du patient
export const processPatientData = async (patientId, extractionData) => {
  try {
    const response = await api.post('/patients/process-data', {
      patient_id: patientId,
      extraction_data: extractionData
    });
    return response.data;
  } catch (error) {
    throw new Error(`Patient data processing failed: ${error.message}`);
  }
};

export default api;
