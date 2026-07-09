import Swal from 'sweetalert2';

const isDarkMode = () => document.documentElement.classList.contains('dark');

const getSwalColors = () => ({
  background: isDarkMode() ? '#1a1c1e' : '#ffffff',
  titleColor: isDarkMode() ? '#f8fafc' : '#1e293b',
  textColor: isDarkMode() ? '#94a3b8' : '#64748b',
});

const commonConfig = {
  confirmButtonColor: '#ffc107', 
  cancelButtonColor: '#ef4444',  
  customClass: {
    popup: 'rounded-2xl border border-border-subtle shadow-2xl',
    confirmButton: 'rounded-lg px-8 py-2.5 font-bold uppercase tracking-widest text-xs text-black', 
    cancelButton: 'rounded-lg px-8 py-2.5 font-bold uppercase tracking-widest text-xs',
    title: 'text-xl font-bold tracking-tight',
    htmlContainer: 'text-sm font-medium leading-relaxed'
  },
  buttonsStyling: true,
};

/**
 * Generic Confirmation Modal
 */
export const swalConfirm = (title = 'Are you sure?', text = "You won't be able to revert this!") => {
  const colors = getSwalColors();
  return Swal.fire({
    ...commonConfig,
    title,
    text,
    icon: 'question',
    iconColor: '#ffc107',
    showCancelButton: true,
    confirmButtonText: 'Yes, proceed',
    cancelButtonText: 'Cancel',
    background: colors.background,
    color: colors.textColor,
  }).then((result) => {
    return result.isConfirmed; // Returns true if confirmed, false otherwise
  });
};

/**
 * Specifically styled for Deletion
 */
export const swalConfirmDelete = (title = 'Are you sure?', text = "You won't be able to revert this!") => {
  const colors = getSwalColors();
  return Swal.fire({
    ...commonConfig,
    title,
    text,
    icon: 'warning',
    iconColor: '#ef4444',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    background: colors.background,
    color: colors.textColor,
  }).then((result) => {
    return result.isConfirmed;
  });
};

export const swalSuccess = (title = 'Success!', text = 'Operation completed successfully.') => {
  const colors = getSwalColors();
  return Swal.fire({
    ...commonConfig,
    title,
    text,
    icon: 'success',
    iconColor: '#22c55e', 
    background: colors.background,
    color: colors.textColor,
  });
};

export const swalError = (title = 'Error!', text = 'Something went wrong.') => {
  const colors = getSwalColors();
  return Swal.fire({
    ...commonConfig,
    title,
    text,
    icon: 'error',
    iconColor: '#ef4444', 
    background: colors.background,
    color: colors.textColor,
  });
};

export const swalToast = (title, icon = 'success') => {
  return Swal.fire({
    title,
    icon,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: isDarkMode() ? '#1a1c1e' : '#ffffff',
    color: isDarkMode() ? '#f8fafc' : '#1e293b',
  });
};