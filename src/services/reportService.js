import { API } from './apiCalls';

export const downloadReportFile = async (endpoint, params, format) => {
  try {
    const response = await API.get(endpoint, {
      params: { ...params, format },
      responseType: 'blob', 
    });

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const extension = format === 'excel' ? 'xlsx' : format;
    link.setAttribute('download', `Report_${new Date().getTime()}.${extension}`);
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed", error);
    alert("Export failed. Please try again.");
  }
};