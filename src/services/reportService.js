import { API } from './apiCalls';

export const downloadReportFile = async (endpoint, params, format) => {
  try {
    const response = await API.get(endpoint, {
      params: { ...params, format },
      responseType: 'blob', 
    });

    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'excel' ? 'xlsx' : format;
    
    link.setAttribute('download', `Roadoz_Report_${timestamp}.${extension}`);
    document.body.appendChild(link);
    link.click();
    
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed", error);
    alert("Could not export the report. Please check if data exists for this period.");
  }
};