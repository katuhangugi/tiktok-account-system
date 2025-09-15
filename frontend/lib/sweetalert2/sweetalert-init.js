/**
 * SweetAlert2 Initialization and Custom Configuration
 */

import Swal from 'sweetalert2';
import { APP_CONSTANTS } from '../../config/constants';

// Default toast configuration
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

// Custom alert types
export const showToast = (type, message) => {
    return Toast.fire({
        icon: type,
        title: message
    });
};

export const showSuccess = (title, message) => {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        confirmButtonColor: '#4e73df'
    });
};

export const showError = (title, message) => {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonColor: '#e74a3b'
    });
};

export const showWarning = (title, message) => {
    return Swal.fire({
        icon: 'warning',
        title: title,
        text: message,
        confirmButtonColor: '#f6c23e'
    });
};

export const showInfo = (title, message) => {
    return Swal.fire({
        icon: 'info',
        title: title,
        text: message,
        confirmButtonColor: '#36b9cc'
    });
};

// Confirmation dialog
export const confirmDialog = (options) => {
    const defaultOptions = {
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4e73df',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, proceed!'
    };

    return Swal.fire({
        ...defaultOptions,
        ...options
    });
};

// Loading alert
export const showLoading = (title = 'Loading...') => {
    return Swal.fire({
        title: title,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
};

// Form dialog
export const showFormDialog = (options) => {
    return Swal.fire({
        title: options.title,
        html: options.html,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: options.confirmText || 'Submit',
        cancelButtonText: options.cancelText || 'Cancel',
        preConfirm: () => {
            const inputs = Swal.getPopup().querySelectorAll('input, select, textarea');
            const values = {};
            
            inputs.forEach(input => {
                if (input.type === 'checkbox') {
                    values[input.name] = input.checked;
                } else if (input.type === 'radio') {
                    if (input.checked) {
                        values[input.name] = input.value;
                    }
                } else {
                    values[input.name] = input.value;
                }
            });
            
            if (options.validate) {
                const validationResult = options.validate(values);
                if (validationResult !== true) {
                    Swal.showValidationMessage(validationResult);
                    return false;
                }
            }
            
            return values;
        },
        ...options
    });
};

// Custom theme configuration
Swal.bindInputClass = 'form-control';
Swal.bindConfirmButtonClass = 'btn btn-primary';
Swal.bindCancelButtonClass = 'btn btn-secondary';

// Global configuration
Swal.default = {
    buttonsStyling: false,
    customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-secondary',
        input: 'form-control'
    }
};