import { Component, ViewChild, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { GestionCreditsService } from '../../services/gestion-credits.service';
import { ToastrService } from 'ngx-toastr';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-saisie-credit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZXingScannerModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './saisie-credit.component.html',
  styleUrls: ['./saisie-credit.component.css']
})
export class SaisieCreditComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scanner') scanner: any;

  // États de l'application
  isScannerActive = false;
  isSubmitting = false;
  isProcessingScan = false;
  isLoadingCredit = false;
  hasPermission = false;
  isCameraInitialized = false;
  showSuccessModal = false;
  scannerReady = false;

  // Données
  scannedVehicule: any = null;
  creditInfo: any = null;
  errorMessage = '';
  redirectSeconds = 5;
  
  // Configuration scanner
  availableFormats: BarcodeFormat[] = [BarcodeFormat.QR_CODE];
  devices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | undefined;
  countdownInterval: any;
  private lastScannedData: string | null = null;
  private scanDebounceTimer: any = null;

  // Transaction
  transaction = {
    quantity: null as number | null,
    amount: null as number | null,
    pricePerLiter: 10.50
  };

  constructor(
    private gestionCreditsService: GestionCreditsService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initializeScanner();
  }

  ngOnDestroy(): void {
    this.stopScanner();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.scanDebounceTimer) {
      clearTimeout(this.scanDebounceTimer);
    }
  }

  initializeScanner(): void {
    if (this.scanner) {
      this.scanner.camerasFound.subscribe((devices: MediaDeviceInfo[]) => {
        this.devices = devices;
        this.isCameraInitialized = true;
        this.scannerReady = true;
        
        if (devices && devices.length > 0) {
          this.currentDevice = this.findBackCamera(devices) || devices[0];
          if (this.isScannerActive) {
            this.startScanner();
          }
        }
      });

      this.scanner.permissionResponse.subscribe((hasPermission: boolean) => {
        this.hasPermission = hasPermission;
        if (!hasPermission) {
          this.handleCameraPermissionError();
        }
      });
    }
  }

  findBackCamera(devices: MediaDeviceInfo[]): MediaDeviceInfo | undefined {
    return devices.find(device => 
      device.label.toLowerCase().includes('back') || 
      device.label.toLowerCase().includes('arrière'));
  }

  handleCameraPermissionError(): void {
    this.errorMessage = 'Permission de la caméra refusée';
    this.toastr.error(this.errorMessage, 'Erreur');
    this.isScannerActive = false;
    this.scannerReady = false;
  }

  toggleScanner(): void {
    if (this.isScannerActive) {
      this.stopScanner();
      this.isScannerActive = false;
      this.lastScannedData = null;
    } else {
      if (this.isCameraInitialized && this.devices.length > 0) {
        this.isScannerActive = true;
        setTimeout(() => this.startScanner(), 100);
      } else {
        this.toastr.info('Initialisation de la caméra...', 'Veuillez patienter');
        this.isScannerActive = true;
      }
    }
  }

  startScanner(): void {
    if (this.currentDevice && !this.scanner.isScanning) {
      try {
        this.scanner.device = this.currentDevice;
        this.scanner.scanStart();
      } catch (error) {
        console.error('Erreur lors du démarrage du scanner:', error);
        this.toastr.error('Erreur lors du démarrage du scanner', 'Erreur');
      }
    }
  }

  stopScanner(): void {
    if (this.scanner && this.scanner.isScanning) {
      try {
        this.scanner.scanStop();
      } catch (error) {
        console.error('Erreur lors de l\'arrêt du scanner:', error);
      }
    }
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.devices = devices;
    if (devices && devices.length > 0) {
      this.currentDevice = this.findBackCamera(devices) || devices[0];
      if (this.isScannerActive) {
        this.startScanner();
      }
    }
  }

  onHasPermission(has: boolean): void {
    this.hasPermission = has;
    if (!has) {
      this.handleCameraPermissionError();
    } else if (this.isScannerActive) {
      this.startScanner();
    }
  }

  onDeviceSelectChange(): void {
    if (this.currentDevice && this.isScannerActive) {
      this.stopScanner();
      setTimeout(() => this.startScanner(), 200);
    }
  }

  onScanSuccess(result: string): void {
    if (this.isProcessingScan || result === this.lastScannedData) {
      return;
    }

    if (this.scanDebounceTimer) {
      clearTimeout(this.scanDebounceTimer);
    }

    this.scanDebounceTimer = setTimeout(() => {
      console.log('QR Code scanné:', result);
      this.lastScannedData = result;
      this.stopScanner();
      this.isScannerActive = false;
      this.processScannedData(result);
      this.scanDebounceTimer = null;
    }, 300);
  }

  private processScannedData(data: string): void {
    this.isProcessingScan = true;
    this.scannedVehicule = null;
    this.creditInfo = null;
    this.errorMessage = '';

    try {
      const lines = data.split('\n');
      const immatriculation = lines[0]?.replace('Immatriculation: ', '').trim();
      
      if (!immatriculation) {
        throw new Error('Immatriculation manquante dans le QR code');
      }

      this.loadVehicleData(immatriculation);
    } catch (error) {
      this.lastScannedData = null;
      this.handleScanError(error);
    }
  }

  private loadVehicleData(immatriculation: string): void {
    this.gestionCreditsService.getVehiculeByImmatriculation(immatriculation).subscribe({
      next: (response: any) => {
        if (!response?.success || !response?.data) {
          this.lastScannedData = null;
          throw new Error(response?.message || 'Données véhicule non reçues');
        }

        this.scannedVehicule = Array.isArray(response.data) ? response.data[0] : response.data;
        
        if (!this.scannedVehicule.id_credit) {
          this.isProcessingScan = false;
          this.lastScannedData = null;
          this.errorMessage = 'Aucun crédit associé à ce véhicule';
          this.toastr.error(this.errorMessage, 'Erreur');
          return;
        }

        this.loadCreditInfo(this.scannedVehicule.id_credit);
      },
      error: (err) => {
        this.lastScannedData = null;
        this.handleScanError(err);
      }
    });
  }

  private loadCreditInfo(creditId: number): void {
    this.isLoadingCredit = true;
    
    this.gestionCreditsService.getCreditById(creditId).subscribe({
      next: (creditResponse: any) => {
        this.isProcessingScan = false;
        this.isLoadingCredit = false;
        
        if (!creditResponse) {
          console.warn('Données crédit non reçues:', creditResponse);
          this.errorMessage = 'Les données de crédit reçues sont incomplètes';
          this.toastr.error(this.errorMessage, 'Erreur');
          return;
        }

        this.creditInfo = creditResponse;
        
        this.creditInfo.solde_credit = parseFloat(this.creditInfo.solde_credit) || 0;
        this.creditInfo.credit_utilise = this.creditInfo.credit_utilise !== null 
          ? parseFloat(this.creditInfo.credit_utilise) 
          : 0;
        
        this.creditInfo.solde_disponible = this.creditInfo.solde_credit - this.creditInfo.credit_utilise;
        
        console.log('Credit info traité:', this.creditInfo);
      },
      error: (creditError) => {
        this.handleCreditError(creditError);
      }
    });
  }

  private handleCreditError(error: any): void {
    this.isProcessingScan = false;
    this.isLoadingCredit = false;
    this.lastScannedData = null;
    
    console.error('Erreur crédit:', error);
    
    this.errorMessage = error.error?.message || 
                       error.message || 
                       'Erreur lors de la récupération des informations de crédit';
    
    this.toastr.error(this.errorMessage, 'Erreur');
  }

  private handleScanError(error: any): void {
    this.isProcessingScan = false;
    this.isLoadingCredit = false;
    console.error('Erreur:', error);
    
    this.errorMessage = error instanceof Error ? error.message : 
                       error.error?.message || 'Erreur inconnue lors du traitement des données scannées';
    
    this.toastr.error(this.errorMessage, 'Erreur');
  }

  calculateQuantity(): void {
    if (this.transaction.amount && this.transaction.pricePerLiter) {
      this.transaction.quantity = parseFloat((this.transaction.amount / this.transaction.pricePerLiter).toFixed(2));
    } else {
      this.transaction.quantity = null;
    }
  }

  get soldeDisponible(): number {
    if (!this.creditInfo) return 0;
    return this.creditInfo.solde_disponible || 0;
  }

  submitTransaction(): void {
    this.errorMessage = '';

    if (!this.scannedVehicule) {
      this.errorMessage = 'Aucun véhicule scanné';
      return;
    }

    if (!this.transaction.amount || !this.transaction.pricePerLiter) {
      this.errorMessage = 'Veuillez remplir le montant et le prix par litre';
      this.toastr.warning(this.errorMessage, 'Champs manquants');
      return;
    }

    const soldeDisponible = this.soldeDisponible;
    if (this.transaction.amount > soldeDisponible) {
      this.errorMessage = `Le montant saisi (${this.transaction.amount} MAD) dépasse le solde disponible (${soldeDisponible} MAD)`;
      this.toastr.error(this.errorMessage, 'Erreur');
      return;
    }

    this.isSubmitting = true;

    const transactionData = {
      id_vehicule: this.scannedVehicule.id,
      id_credit: this.scannedVehicule.id_credit,
      quantite: this.transaction.quantity,
      montant: this.transaction.amount,
      prix_litre: this.transaction.pricePerLiter
    };

    this.gestionCreditsService.createTransaction(transactionData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccessModal = true;
        this.startCountdown();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Erreur lors de l\'enregistrement:', err);
        
        if (err.status === 400) {
          this.errorMessage = 'Solde insuffisant pour effectuer cette transaction';
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de l\'enregistrement de la transaction';
        }
        
        this.toastr.error(this.errorMessage, 'Erreur');
      }
    });
  }

  startCountdown(): void {
    this.redirectSeconds = 5;
    this.countdownInterval = setInterval(() => {
      this.redirectSeconds--;
      if (this.redirectSeconds <= 0) {
        clearInterval(this.countdownInterval);
        this.closeSuccessModal();
      }
    }, 1000);
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    clearInterval(this.countdownInterval);
    this.resetForm();
  }

  resetForm(): void {
    this.transaction = {
      quantity: null,
      amount: null,
      pricePerLiter: 10.50
    };
    this.scannedVehicule = null;
    this.creditInfo = null;
    this.isProcessingScan = false;
    this.errorMessage = '';
    this.lastScannedData = null;
  }
}