export class Modal {
    constructor() {
        this.modals = {};
    }

    init() {
        this.setupEventListeners();
    }

    show(modalId, options = {}) {
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        
        // Store modal instance
        this.modals[modalId] = modal;
        
        // Set title if provided
        if (options.title) {
            const titleElement = document.querySelector(`#${modalId} .modal-title`);
            if (titleElement) titleElement.textContent = options.title;
        }
        
        // Set content if provided
        if (options.content) {
            const bodyElement = document.querySelector(`#${modalId} .modal-body`);
            if (bodyElement) bodyElement.innerHTML = options.content;
        }
        
        // Show the modal
        modal.show();
        
        return modal;
    }

    hide(modalId) {
        if (this.modals[modalId]) {
            this.modals[modalId].hide();
        }
    }

    confirm(options) {
        return new Promise((resolve) => {
            const modalId = 'confirmModal';
            const modalTemplate = `
                <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header ${options.danger ? 'bg-danger text-white' : ''}">
                                <h5 class="modal-title">${options.title || 'Confirm Action'}</h5>
                                <button type="button" class="btn-close ${options.danger ? 'btn-close-white' : ''}" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>${options.message || 'Are you sure you want to perform this action?'}</p>
                                ${options.warning ? `<div class="alert alert-warning mt-3">${options.warning}</div>` : ''}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn ${options.danger ? 'btn-danger' : 'btn-primary'}" id="confirmAction">${options.confirmText || 'Confirm'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to DOM
            const modalContainer = document.getElementById('modals-container');
            modalContainer.innerHTML = modalTemplate;
            
            // Show the modal
            const modal = this.show(modalId);
            
            // Handle confirm button click
            document.getElementById('confirmAction').addEventListener('click', () => {
                modal.hide();
                resolve(true);
            });
            
            // Handle cancel/close
            modal._element.addEventListener('hidden.bs.modal', () => {
                modal.dispose();
                resolve(false);
            }, { once: true });
        });
    }

    setupEventListeners() {
        // Handle all modal forms with data-modal-form attribute
        document.querySelectorAll('[data-modal-form]').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const modalId = form.closest('.modal').id;
                const submitBtn = form.querySelector('[type="submit"]');
                
                try {
                    // Disable submit button
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
                    
                    // Here you would typically handle form submission
                    // For now, we'll just simulate a delay
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Close modal on success
                    this.hide(modalId);
                    window.app.ui.showSuccess('Success', 'Action completed successfully');
                } catch (error) {
                    console.error('Form submission error:', error);
                    window.app.ui.showError('Error', 'Failed to complete action');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Submit';
                }
            });
        });
    }
}