import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionStockService } from '../../services/gestion-stock.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-ajouter-vente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    DecimalPipe,
    DatePipe,
  ],
  templateUrl: './ajouter-vente.component.html',
  styleUrls: ['./ajouter-vente.component.css'],
  providers: [DecimalPipe, DatePipe],
})
export class AjouterVenteComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;

  currentUser: any = null;
  products: any[] = [];
  filteredProducts: any[] = [];
  cartItems: any[] = [];
  paymentMethods = ['ESPECES', 'CARTE', 'CHEQUE'];
  selectedPaymentMethod = 'ESPECES';
  amountPaid = 0;
  changeAmount = 0;
  barcodeValue = '';
  searchTerm = '';
  showScannerModal = false;
  showConfirmModal = false;
  showReceiptModal = false;
  isProcessing = false;
  isLoading = false;
  lastSale: any = null;
  isScanning = false;
  stream: MediaStream | null = null;
  barcodeDetector: any;
  scanInterval: any;
  facingMode: 'environment' | 'user' = 'environment';
  scanAttempts = 0;

  private searchSubject = new Subject<string>();

  constructor(
    private stockService: GestionStockService,
    private authService: AuthService,
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadProducts();

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(term => {
        this.searchTerm = term;
        this.filterProducts();
      });

    this.initializeBarcodeDetector();
  }

  ngOnDestroy(): void {
    this.stopScanner();
    this.searchSubject.complete();
  }

  initializeBarcodeDetector(): void {
    if ('BarcodeDetector' in window) {
      try {
        this.barcodeDetector = new (window as any).BarcodeDetector({
          formats: [
            'ean_13',
            'ean_8',
            'upc_a',
            'upc_e',
            'code_39',
            'code_128',
            'qr_code',
          ],
        });
      } catch (e) {
        console.error('Erreur initialisation BarcodeDetector:', e);
      }
    } else {
      console.warn('BarcodeDetector API non supportée par ce navigateur');
    }
  }

  filterProducts(): void {
    if (!this.searchTerm) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products
      .filter(
        product =>
          product.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          (product.code_barre &&
            product.code_barre.toString().includes(this.searchTerm))
      )
      .slice(0, 5);
  }

  loadUserProfile(): void {
    this.authService.getProfile().subscribe({
      next: data => {
        if (data && (Array.isArray(data) ? data[0] : data)) {
          this.currentUser = Array.isArray(data) ? data[0][0] || data[0] : data;
        }
      },
      error: err => {
        console.error('Profile load error:', err);
      },
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.stockService.getAllProduits().subscribe({
      next: products => {
        this.products = products || [];
        this.filteredProducts = [...this.products];
        this.isLoading = false;
      },
      error: err => {
        console.error('Erreur chargement produits:', err);
        this.isLoading = false;
      },
    });
  }

  openScannerModal(): void {
    this.showScannerModal = true;
    this.startScanner();
  }

  closeScannerModal(): void {
    this.showScannerModal = false;
    this.stopScanner();
  }

  switchCamera(): void {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    this.stopScanner();
    this.startScanner();
  }

  async startScanner(): Promise<void> {
    this.isScanning = true;
    this.scanAttempts = 0;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      this.videoElement.nativeElement.srcObject = this.stream;
      await this.videoElement.nativeElement.play();

      this.scanInterval = setInterval(() => this.detectBarcode(), 500);
    } catch (err) {
      console.error('Erreur accès caméra:', err);
      this.handleCameraError(err);
    }
  }

  stopScanner(): void {
    this.isScanning = false;

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }

  handleCameraError(err: any): void {
    this.stopScanner();

    if (err.name === 'NotAllowedError') {
      alert(
        "Permission caméra refusée. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur."
      );
    } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
      alert('Aucune caméra adaptée trouvée.');
    } else {
      alert("Erreur lors de l'accès à la caméra: " + err.message);
    }

    this.showScannerModal = false;
  }

  async detectBarcode(): Promise<void> {
    if (!this.isScanning || !this.barcodeDetector || !this.stream) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const barcodes = await this.barcodeDetector.detect(canvas);
        if (barcodes.length > 0) {
          this.handleScannedBarcode(barcodes[0].rawValue);
        } else {
          this.scanAttempts++;
          if (this.scanAttempts > 10) {
            // Réduire la fréquence de scan après plusieurs tentatives infructueuses
            clearInterval(this.scanInterval);
            this.scanInterval = setInterval(() => this.detectBarcode(), 1000);
          }
        }
      } catch (err) {
        console.error('Erreur détection code-barres:', err);
      }
    }
  }

  handleScannedBarcode(barcode: string): void {
    if (!barcode) return;

    this.barcodeValue = barcode;
    const product = this.products.find(p => p.code_barre === barcode);

    if (product) {
      this.addToCart(product);
      this.stopScanner();
      this.showScannerModal = false;
      this.barcodeValue = '';
    } else {
      alert('Produit non trouvé avec ce code-barre: ' + barcode);
    }
  }

  handleManualBarcode(): void {
    if (this.barcodeValue.trim()) {
      const product = this.products.find(
        p => p.code_barre === this.barcodeValue.trim()
      );

      if (product) {
        this.addToCart(product);
        this.barcodeValue = '';
        this.barcodeInput.nativeElement.focus();
      } else {
        alert('Produit non trouvé avec ce code-barre');
        this.barcodeInput.nativeElement.select();
      }
    }
  }

  addToCart(product: any): void {
    const existingItem = this.cartItems.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cartItems.push({
        ...product,
        quantity: 1,
      });
    }

    this.calculateChange();
  }

  removeFromCart(index: number): void {
    this.cartItems.splice(index, 1);
    this.calculateChange();
  }

  updateQuantity(item: any, newQuantity: number): void {
    item.quantity = Math.max(1, newQuantity);
    this.calculateChange();
  }

  validateQuantity(item: any): void {
    if (isNaN(item.quantity)) item.quantity = 1;
    if (item.quantity < 1) item.quantity = 1;
    this.calculateChange();
  }

  clearCart(): void {
    this.cartItems = [];
    this.amountPaid = 0;
    this.changeAmount = 0;
  }

  getTotalAmount(): number {
    return this.cartItems.reduce(
      (sum, item) => sum + item.prix_vente * item.quantity,
      0
    );
  }

  calculateChange(): void {
    this.changeAmount = Math.max(0, this.amountPaid - this.getTotalAmount());
  }

  confirmSale(): void {
    if (this.cartItems.length === 0) {
      alert('Le panier est vide');
      return;
    }
    if (this.amountPaid < this.getTotalAmount()) {
      alert('Montant insuffisant');
      return;
    }
    this.showConfirmModal = true;
  }

  processSale(): void {
    this.isProcessing = true;
    // Vérifiez que currentUser et son ID sont bien disponibles
    if (!this.currentUser || !this.currentUser.id) {
      alert('Erreur: Utilisateur non connecté');
      this.isProcessing = false;
      return;
    }
    const saleData = {
      montant_total: this.getTotalAmount(),
      montant_paye: this.amountPaid,
      monnaie_rendue: this.changeAmount,
      mode_paiement: this.selectedPaymentMethod,
      id_caissier: this.currentUser.id,
      produits_vendus: this.cartItems.map(item => ({
        id: item.id,
        quantite: item.quantity,
        prix_unitaire: item.prix_vente,
      })),
    };

    this.stockService.createVente(saleData).subscribe({
      next: sale => {
        this.lastSale = sale;
        this.isProcessing = false;
        this.showConfirmModal = false;
        this.clearCart();
        this.showReceiptModal = true;
      },
      error: err => {
        console.error('Erreur création vente:', err);
        alert('Erreur lors de la création de la vente');
        this.isProcessing = false;
      },
    });
  }

  printReceipt(): void {
    const printContent = document.getElementById('printableReceipt');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reçu de vente #${this.lastSale.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
            .receipt { max-width: 300px; margin: 0 auto; }
            .receipt-header { text-align: center; margin-bottom: 10px; }
            .receipt-header h4 { margin: 0; font-weight: bold; }
            .receipt-info { font-size: 12px; margin-top: 5px; }
            .receipt-items { margin: 10px 0; }
            .receipt-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .item-name { flex-grow: 1; }
            .item-price { text-align: right; min-width: 80px; }
            .receipt-totals { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
            .total-line { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .payment-method { margin-top: 5px; font-style: italic; text-align: center; }
            .receipt-footer { margin-top: 15px; font-size: 12px; text-align: center; }
            .text-muted { color: #6c757d; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 100);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  closeReceiptModal(): void {
    this.showReceiptModal = false;
  }

  getProductName(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.nom : 'Produit inconnu';
  }
}
