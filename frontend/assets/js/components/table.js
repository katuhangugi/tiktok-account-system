export class DataTable {
    constructor(tableId, options = {}) {
        this.tableId = tableId;
        this.options = {
            ajax: null,
            columns: [],
            selectable: false,
            exportable: false,
            searchable: true,
            pagination: true,
            ...options
        };
        this.table = null;
        this.data = [];
    }

    async init() {
        await this.loadData();
        this.renderTable();
        this.setupEventListeners();
    }

    async loadData() {
        if (this.options.ajax) {
            try {
                this.data = await window.app.api.get(this.options.ajax);
            } catch (error) {
                console.error('Failed to load table data:', error);
                window.app.ui.showError('Load Error', 'Failed to load table data');
                this.data = [];
            }
        }
    }

    renderTable() {
        const tableElement = document.getElementById(this.tableId);
        if (!tableElement) return;
        
        // Clear existing table if needed
        if (this.table) {
            this.table.destroy();
        }
        
        // Initialize DataTable
        this.table = $(`#${this.tableId}`).DataTable({
            data: this.data,
            columns: this.options.columns,
            responsive: true,
            dom: '<"top"<"row"<"col-md-6"l><"col-md-6"f>>>rt<"bottom"<"row"<"col-md-6"i><"col-md-6"p>>>',
            language: {
                search: "_INPUT_",
                searchPlaceholder: "Search...",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                infoEmpty: "Showing 0 to 0 of 0 entries",
                infoFiltered: "(filtered from _MAX_ total entries)",
                paginate: {
                    first: "First",
                    last: "Last",
                    next: "Next",
                    previous: "Previous"
                }
            },
            drawCallback: () => {
                // Add custom classes after table is drawn
                this.addRowClasses();
            }
        });
    }

    addRowClasses() {
        // Add custom classes to rows based on data
        $(`#${this.tableId} tbody tr`).each(function() {
            const row = $(this);
            const data = row.data();
            
            if (data?.status === 'inactive') {
                row.addClass('table-secondary');
            }
            
            if (data?.highlight) {
                row.addClass('table-warning');
            }
        });
    }

    setupEventListeners() {
        // Row selection
        if (this.options.selectable) {
            $(`#${this.tableId} tbody`).on('click', 'tr', function() {
                $(this).toggleClass('selected');
            });
        }
        
        // Export button
        if (this.options.exportable) {
            document.getElementById(`export-${this.tableId}-btn`)?.addEventListener('click', () => {
                this.exportData();
            });
        }
        
        // Refresh button
        document.getElementById(`refresh-${this.tableId}-btn`)?.addEventListener('click', async () => {
            await this.loadData();
            this.table.clear().rows.add(this.data).draw();
        });
    }

    exportData() {
        // Get the selected columns
        const columns = this.table.columns().header().toArray()
            .map(header => $(header).text());
        
        // Get the data
        const data = this.table.rows({ search: 'applied' }).data().toArray();
        
        // Convert to CSV
        let csv = columns.join(',') + '\n';
        
        data.forEach(row => {
            const values = [];
            for (const key in row) {
                if (columns.includes(key)) {
                    values.push(`"${String(row[key]).replace(/"/g, '""')}"`);
                }
            }
            csv += values.join(',') + '\n';
        });
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.tableId}-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}