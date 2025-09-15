/**
 * DataTables Initialization and Custom Configuration
 */

import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-responsive-bs5';
import 'datatables.net-buttons-bs5';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';

// Extend DataTables with custom features
$.extend(true, $.fn.dataTable.defaults, {
    responsive: true,
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
    dom: '<"top"<"row"<"col-md-6"l><"col-md-6"f>>>rt<"bottom"<"row"<"col-md-6"i><"col-md-6"p>>>',
    initComplete: function() {
        // Add custom classes after initialization
        this.api().columns().every(function() {
            const column = this;
            $('input, select', column.header()).on('keyup change', function() {
                if (column.search() !== this.value) {
                    column.search(this.value).draw();
                }
            });
        });
    },
    drawCallback: function() {
        // Add custom classes after draw
        $('.dataTables_filter input').addClass('form-control form-control-sm');
        $('.dataTables_length select').addClass('form-select form-select-sm');
    }
});

// Custom export buttons configuration
$.fn.dataTable.ext.buttons.customExport = {
    extend: 'collection',
    text: 'Export',
    className: 'btn-sm btn-outline-secondary',
    buttons: [
        {
            extend: 'csv',
            text: 'CSV',
            className: 'btn-sm',
            exportOptions: {
                columns: ':visible'
            }
        },
        {
            extend: 'excel',
            text: 'Excel',
            className: 'btn-sm',
            exportOptions: {
                columns: ':visible'
            }
        },
        {
            extend: 'print',
            text: 'Print',
            className: 'btn-sm',
            exportOptions: {
                columns: ':visible'
            }
        }
    ]
};

// Initialize DataTable with custom options
export function initDataTable(tableId, options = {}) {
    const defaultOptions = {
        responsive: true,
        buttons: ['customExport'],
        dom: '<"top"<"row"<"col-md-6"l><"col-md-6"fB>>>rt<"bottom"<"row"<"col-md-6"i><"col-md-6"p>>>'
    };

    return $(`#${tableId}`).DataTable({
        ...defaultOptions,
        ...options
    });
}

// Row selection plugin
$.fn.dataTable.Api.register('selectRow()', function(index) {
    return this.rows(index).nodes().to$().addClass('selected');
});

$.fn.dataTable.Api.register('deselectRow()', function(index) {
    return this.rows(index).nodes().to$().removeClass('selected');
});

// Custom column filter
export function addColumnFilter(table, columnIndex, options = {}) {
    const column = table.column(columnIndex);
    const select = $('<select class="form-select form-select-sm"><option value="">All</option></select>')
        .appendTo($(column.header()).empty())
        .on('change', function() {
            column.search($(this).val()).draw();
        });

    column.data().unique().sort().each(function(d) {
        select.append(`<option value="${d}">${d}</option>`);
    });
}