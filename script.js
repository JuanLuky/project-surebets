class SurebetManager {
    constructor() {
        this.surebets = JSON.parse(localStorage.getItem('surebets')) || [];
        this.initializeElements();
        this.bindEvents();
        this.updateStats();
        this.renderTable();
        this.setDefaultDate();
    }

    initializeElements() {
        // Form elements
        this.form = document.getElementById('surebetForm');
        this.dataInput = document.getElementById('data');
        this.odd1Input = document.getElementById('odd1');
        this.odd2Input = document.getElementById('odd2');
        this.casa1Select = document.getElementById('casa1');
        this.casa2Select = document.getElementById('casa2');
        this.valorTotalInput = document.getElementById('valorTotal');

        // Result elements
        this.arbitragemElement = document.getElementById('arbitragem');
        this.lucroPercentualElement = document.getElementById('lucroPercentual');
        this.apostaCasa1Element = document.getElementById('apostaCasa1');
        this.apostaCasa2Element = document.getElementById('apostaCasa2');
        this.lucroGarantidoElement = document.getElementById('lucroGarantido');

        // Stats elements
        this.totalApostadoElement = document.getElementById('totalApostado');
        this.lucroTotalElement = document.getElementById('lucroTotal');
        this.percentualMedioElement = document.getElementById('percentualMedio');
        this.totalApostasElement = document.getElementById('totalApostas');

        // Table and buttons
        this.tableBody = document.getElementById('apostasTableBody');
        this.exportBtn = document.getElementById('exportBtn');
        this.clearBtn = document.getElementById('clearBtn');
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time calculation
        [this.odd1Input, this.odd2Input, this.valorTotalInput].forEach(input => {
            input.addEventListener('input', () => this.calculateSurebet());
        });

        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.clearBtn.addEventListener('click', () => this.clearData());
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        this.dataInput.value = today;
    }

    calculateSurebet() {
        const odd1 = parseFloat(this.odd1Input.value) || 0;
        const odd2 = parseFloat(this.odd2Input.value) || 0;
        const valorTotal = parseFloat(this.valorTotalInput.value) || 0;

        if (odd1 <= 1 || odd2 <= 1 || valorTotal <= 0) {
            this.clearResults();
            return;
        }

        // Cálculo da arbitragem
        const arbitragem = (1 / odd1) + (1 / odd2);
        const isValid = arbitragem < 1;

        // Cálculo das apostas
        const apostaCasa1 = (1 / odd1 / arbitragem) * valorTotal;
        const apostaCasa2 = (1 / odd2 / arbitragem) * valorTotal;

        // Cálculo dos retornos
        const retorno1 = apostaCasa1 * odd1;
        const retorno2 = apostaCasa2 * odd2;
        const lucroGarantido = Math.min(retorno1, retorno2) - valorTotal;
        const lucroPercentual = (lucroGarantido / valorTotal) * 100;

        // Atualizar interface
        this.arbitragemElement.innerHTML = `
            <span class="arbitrage-indicator ${isValid ? 'valid' : 'invalid'}">
                ${arbitragem.toFixed(4)} ${isValid ? '✓ VÁLIDA' : '✗ INVÁLIDA'}
            </span>
        `;
        
        this.lucroPercentualElement.innerHTML = `
            <span class="${isValid ? 'status-valid' : 'status-invalid'}">
                ${lucroPercentual.toFixed(2)}%
            </span>
        `;
        
        this.apostaCasa1Element.textContent = `R$ ${apostaCasa1.toFixed(2)}`;
        this.apostaCasa2Element.textContent = `R$ ${apostaCasa2.toFixed(2)}`;
        
        this.lucroGarantidoElement.innerHTML = `
            <span class="${isValid ? 'status-valid' : 'status-invalid'}">
                R$ ${lucroGarantido.toFixed(2)}
            </span>
        `;
    }

    clearResults() {
        this.arbitragemElement.textContent = '-';
        this.lucroPercentualElement.textContent = '-';
        this.apostaCasa1Element.textContent = '-';
        this.apostaCasa2Element.textContent = '-';
        this.lucroGarantidoElement.textContent = '-';
    }

    handleSubmit(e) {
        e.preventDefault();

        const odd1 = parseFloat(this.odd1Input.value);
        const odd2 = parseFloat(this.odd2Input.value);
        const valorTotal = parseFloat(this.valorTotalInput.value);

        // Verificar se é uma surebet válida
        const arbitragem = (1 / odd1) + (1 / odd2);
        if (arbitragem >= 1) {
            alert('Esta não é uma surebet válida! A arbitragem deve ser menor que 1.');
            return;
        }

        // Verificar se as casas são diferentes
        if (this.casa1Select.value === this.casa2Select.value) {
            alert('As casas de aposta devem ser diferentes!');
            return;
        }

        // Calcular valores
        const apostaCasa1 = (1 / odd1 / arbitragem) * valorTotal;
        const apostaCasa2 = (1 / odd2 / arbitragem) * valorTotal;
        const retorno = Math.min(apostaCasa1 * odd1, apostaCasa2 * odd2);
        const lucro = retorno - valorTotal;
        const porcentagem = (lucro / valorTotal) * 100;

        // Criar objeto surebet
        const surebet = {
            id: Date.now(),
            data: this.dataInput.value,
            odd1: odd1,
            odd2: odd2,
            casa1: this.casa1Select.value,
            casa2: this.casa2Select.value,
            valorTotal: valorTotal,
            apostaCasa1: apostaCasa1,
            apostaCasa2: apostaCasa2,
            lucro: lucro,
            porcentagem: porcentagem,
            arbitragem: arbitragem
        };

        // Adicionar à lista
        this.surebets.push(surebet);
        this.saveToLocalStorage();
        this.updateStats();
        this.renderTable();
        
        // Limpar formulário
        this.form.reset();
        this.setDefaultDate();
        this.clearResults();
        
        // Feedback visual
        this.showSuccessMessage();
    }

    showSuccessMessage() {
        const button = document.querySelector('.btn-add');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> ADICIONADO!';
        button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }, 2000);
    }

    deleteSurebet(id) {
        if (confirm('Tem certeza que deseja excluir esta surebet?')) {
            this.surebets = this.surebets.filter(s => s.id !== id);
            this.saveToLocalStorage();
            this.updateStats();
            this.renderTable();
        }
    }

    updateStats() {
        const totalApostado = this.surebets.reduce((sum, s) => sum + s.valorTotal, 0);
        const lucroTotal = this.surebets.reduce((sum, s) => sum + s.lucro, 0);
        const percentualMedio = this.surebets.length > 0 
            ? this.surebets.reduce((sum, s) => sum + s.porcentagem, 0) / this.surebets.length 
            : 0;

        this.totalApostadoElement.textContent = this.formatCurrency(totalApostado);
        this.lucroTotalElement.textContent = this.formatCurrency(lucroTotal);
        this.percentualMedioElement.textContent = `${percentualMedio.toFixed(2)}%`;
        this.totalApostasElement.textContent = this.surebets.length;
    }

    renderTable() {
        this.tableBody.innerHTML = '';

        if (this.surebets.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                        Nenhuma surebet registrada ainda
                    </td>
                </tr>
            `;
            return;
        }

        // Ordenar por data (mais recente primeiro)
        const sortedSurebets = [...this.surebets].sort((a, b) => new Date(b.data) - new Date(a.data));

        sortedSurebets.forEach(surebet => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(surebet.data)}</td>
                <td>${surebet.odd1.toFixed(2)} / ${surebet.odd2.toFixed(2)}</td>
                <td>${surebet.casa1} / ${surebet.casa2}</td>
                <td>${this.formatCurrency(surebet.valorTotal)}</td>
                <td>
                    ${this.formatCurrency(surebet.apostaCasa1)}<br>
                    ${this.formatCurrency(surebet.apostaCasa2)}
                </td>
                <td class="status-valid">${this.formatCurrency(surebet.lucro)}</td>
                <td class="status-valid">${surebet.porcentagem.toFixed(2)}%</td>
                <td>
                    <button class="btn-delete" onclick="surebetManager.deleteSurebet(${surebet.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            this.tableBody.appendChild(row);
        });
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    }

    saveToLocalStorage() {
        localStorage.setItem('surebets', JSON.stringify(this.surebets));
    }

    exportToCSV() {
        if (this.surebets.length === 0) {
            alert('Não há dados para exportar!');
            return;
        }

        const headers = [
            'Data', 'Odd Casa 1', 'Odd Casa 2', 'Casa 1', 'Casa 2', 
            'Valor Total', 'Aposta Casa 1', 'Aposta Casa 2', 'Lucro', 'Porcentagem'
        ];

        const csvContent = [
            headers.join(';'),
            ...this.surebets.map(s => [
                this.formatDate(s.data),
                s.odd1.toFixed(2).replace('.', ','),
                s.odd2.toFixed(2).replace('.', ','),
                s.casa1,
                s.casa2,
                s.valorTotal.toFixed(2).replace('.', ','),
                s.apostaCasa1.toFixed(2).replace('.', ','),
                s.apostaCasa2.toFixed(2).replace('.', ','),
                s.lucro.toFixed(2).replace('.', ','),
                s.porcentagem.toFixed(2).replace('.', ',') + '%'
            ].join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `surebets_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    clearData() {
        if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
            this.surebets = [];
            this.saveToLocalStorage();
            this.updateStats();
            this.renderTable();
            alert('Dados limpos com sucesso!');
        }
    }
}

// Inicializar aplicação
const surebetManager = new SurebetManager();