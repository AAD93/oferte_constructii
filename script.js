document.addEventListener('DOMContentLoaded', () => {
    // Referințe către elementele DOM
    const addServiceBtn = document.getElementById('add-service-btn');
    const servicesBody = document.getElementById('services-body');
    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    const offerForm = document.getElementById('offer-form');
    const offerDateInput = document.getElementById('offer-date');

    // Setează data curentă în câmpul de dată
    offerDateInput.valueAsDate = new Date();

    const VAT_RATE = 0.21; // Cota TVA (21%)

    // Funcție pentru adăugarea unui nou rând de serviciu
    const addServiceRow = () => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="service-name" placeholder="Ex: Montaj parchet"></td>
            <td><input type="text" class="service-um" placeholder="mp/buc/ml"></td>
            <td><input type="number" class="service-qty" value="1" min="0"></td>
            <td><input type="number" class="service-price" value="0.00" min="0" step="0.01"></td>
            <td class="total-cell">0.00</td>
            <td><button type="button" class="btn btn-danger delete-row-btn">Șterge</button></td>
        `;
        servicesBody.appendChild(row);
    };

    // Funcție pentru calcularea totalurilor
    const calculateTotals = () => {
        let subtotal = 0;
        const rows = servicesBody.querySelectorAll('tr');

        rows.forEach(row => {
            const qty = parseFloat(row.querySelector('.service-qty').value) || 0;
            const price = parseFloat(row.querySelector('.service-price').value) || 0;
            const lineTotal = qty * price;
            
            row.querySelector('.total-cell').textContent = lineTotal.toFixed(2);
            subtotal += lineTotal;
        });

        const vat = subtotal * VAT_RATE;
        const total = subtotal + vat;

        // Actualizează cardul de rezumat
        document.getElementById('summary-subtotal').textContent = `${subtotal.toFixed(2)} RON`;
        document.getElementById('summary-vat').textContent = `${vat.toFixed(2)} RON`;
        document.getElementById('summary-total').textContent = `${total.toFixed(2)} RON`;
    };

    // Funcție pentru generarea PDF-ului
    const generatePDF = async () => {
        // 1. Colectează datele
        const clientName = document.getElementById('client-name').value;
        const clientPhone = document.getElementById('client-phone').value;
        const clientAddress = document.getElementById('client-address').value;
        const offerDate = new Date(document.getElementById('offer-date').value).toLocaleDateString('ro-RO');

        // Generează un cod unic pentru ofertă
        const offerCode = `OF-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(1000 + Math.random() * 9000)}`;

        // 2. Populează structura HTML pentru PDF
        document.getElementById('pdf-client-name').textContent = clientName;
        document.getElementById('pdf-client-phone').textContent = `Tel: ${clientPhone}`;
        document.getElementById('pdf-client-address').textContent = `Adresa: ${clientAddress}`;
        document.getElementById('pdf-offer-code').textContent = offerCode;
        document.getElementById('pdf-offer-date').textContent = offerDate;
        document.getElementById('pdf-client-name-end').textContent = clientName;

        // Clonează tabelul de servicii în containerul PDF
        const pdfTableContainer = document.getElementById('pdf-services-table-container');
        const servicesTableClone = document.getElementById('services-table').cloneNode(true);
        
        // Curăță tabelul clonat de elemente inutile (input-uri, butoane)
        servicesTableClone.querySelectorAll('input').forEach(input => {
            const cell = input.parentElement;
            cell.textContent = input.value;
        });
        servicesTableClone.querySelectorAll('.delete-row-btn').forEach(btn => btn.parentElement.remove());
        servicesTableClone.querySelector('th:last-child').remove(); // Elimină coloana "Acțiune"

        pdfTableContainer.innerHTML = ''; // Golește containerul
        pdfTableContainer.appendChild(servicesTableClone);

        // Populează totalurile în PDF
        document.getElementById('pdf-subtotal').textContent = document.getElementById('summary-subtotal').textContent.replace(' RON', '');
        document.getElementById('pdf-vat').textContent = document.getElementById('summary-vat').textContent.replace(' RON', '');
        document.getElementById('pdf-total').textContent = document.getElementById('summary-total').textContent.replace(' RON', '');

        // 3. Generează PDF-ul folosind html2canvas și jsPDF
        const pdfContent = document.getElementById('pdf-content');
        
        // Folosește window.jspdf
        const { jsPDF } = window.jspdf;

        try {
            const canvas = await html2canvas(pdfContent, { scale: 2 }); // Am eliminat useCORS, nu mai este necesar pentru imagini locale
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Oferta-${offerCode}.pdf`);

        } catch (error) {
            console.error("Eroare la generarea PDF-ului:", error);
            alert("A apărut o eroare la generarea PDF-ului. Verificați consola pentru detalii.");
        }
    };

    // --- Event Listeners ---

    // Adaugă un rând nou la click
    addServiceBtn.addEventListener('click', addServiceRow);

    // Calculează totalurile la orice modificare în tabel sau șterge un rând
    servicesBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('service-qty') || e.target.classList.contains('service-price')) {
            calculateTotals();
        }
    });

    servicesBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-row-btn')) {
            e.target.closest('tr').remove();
            calculateTotals();
        }
    });

    // Generează PDF-ul la click
    generatePdfBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Previne trimiterea formularului
        if (offerForm.checkValidity()) {
            generatePDF();
        } else {
            offerForm.reportValidity();
            alert('Vă rugăm completați toate datele clientului.');
        }
    });

    // Adaugă un rând inițial la încărcarea paginii
    addServiceRow();
});
