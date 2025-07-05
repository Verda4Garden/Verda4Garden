document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('invoiceSearchForm');
    const resultContainer = document.getElementById('transactionResult');
    const resultDetails = document.getElementById('resultDetails');
    const currentYearSpan = document.getElementById('currentYear');

    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const invoiceId = document.getElementById('invoiceIdInput').value.trim();
        if (!invoiceId) return;

        const transactionData = localStorage.getItem(invoiceId);

        if (transactionData) {
            const tx = JSON.parse(transactionData);
            let itemsHtml = '';
            tx.cart.forEach(item => {
                itemsHtml += `
                    <div class="tx-item">
                        <span class="tx-item-icon">${item.emoji || '📦'}</span>
                        <div class="tx-item-details">
                            <span>${item.name} (x${item.qty})</span>
                            <span>${formatPrice(item.price * item.qty)}</span>
                        </div>
                    </div>
                `;
            });

            let detailsHtml = `
                <div class="tx-header">
                    <h3>Detail Transaksi</h3>
                    <span class="status-success">LUNAS</span>
                </div>
                <div class="tx-info">
                    <p><strong>Nomor Invoice:</strong> ${tx.invoiceId}</p>
                    <p><strong>Tanggal:</strong> ${tx.date}</p>
                    <p><strong>Nama Akun:</strong> ${tx.buyerName}</p>
                    <p><strong>Metode Pembayaran:</strong> ${tx.paymentMethod}</p>
                </div>
                <div class="tx-items-container">
                    <h4>Item yang Dibeli:</h4>
                    ${itemsHtml}
                </div>
                <div class="tx-summary">
                    <p><span>Subtotal:</span> <span>${formatPrice(tx.subtotal)}</span></p>
                    ${tx.discount > 0 ? `<p class="discount"><span>Diskon (${tx.promoCode}):</span> <span>-${formatPrice(tx.discount)}</span></p>` : ''}
                    <p class="total"><span>Total Pembayaran:</span> <span>${formatPrice(tx.total)}</span></p>
                </div>
                <button id="printInvoiceBtn" class="print-button"><i class="fas fa-print"></i> Cetak Invoice</button>
            `;
            
            resultDetails.innerHTML = detailsHtml;
            resultContainer.style.display = 'block';

            document.getElementById('printInvoiceBtn').addEventListener('click', () => printInvoice(tx));
        } else {
            resultDetails.innerHTML = `<p>Invoice dengan nomor <strong>${invoiceId}</strong> tidak ditemukan.</p>`;
            resultContainer.style.display = 'block';
        }
    });
});

function formatPrice(num) {
    return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function printInvoice(tx) {
    let itemsHtml = '';
    tx.cart.forEach(item => {
        itemsHtml += `
            <tr>
                <td>${item.name} (x${item.qty})</td>
                <td style="text-align: right;">${formatPrice(item.price * item.qty)}</td>
            </tr>
        `;
    });

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Invoice ' + tx.invoiceId + '</title>');
    printWindow.document.write(`
        <style>
            body { font-family: 'Segoe UI', sans-serif; color: #333; }
            .print-container { max-width: 700px; margin: auto; padding: 20px; }
            h1, h2 { color: #1a1a2e; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            .summary { margin-top: 20px; text-align: right; }
            .summary p { margin: 5px 0; }
        </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="print-container">');
    printWindow.document.write('<h1>Verda4Garden</h1>');
    printWindow.document.write('<h2>Detail Invoice</h2>');
    printWindow.document.write(`<p><strong>Invoice:</strong> ${tx.invoiceId}</p>`);
    printWindow.document.write(`<p><strong>Tanggal:</strong> ${tx.date}</p>`);
    printWindow.document.write(`<p><strong>Nama Akun:</strong> ${tx.buyerName}</p>`);
    printWindow.document.write('<table><thead><tr><th>Produk</th><th>Harga</th></tr></thead><tbody>');
    printWindow.document.write(itemsHtml);
    printWindow.document.write('</tbody></table>');
    printWindow.document.write('<div class="summary">');
    printWindow.document.write(`<p>Subtotal: ${formatPrice(tx.subtotal)}</p>`);
    if (tx.discount > 0) {
        printWindow.document.write(`<p>Diskon: -${formatPrice(tx.discount)}</p>`);
    }
    printWindow.document.write(`<p><strong>Total: ${formatPrice(tx.total)}</strong></p>`);
    printWindow.document.write('</div>');
    printWindow.document.write('</div></body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}