import {
  Component,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
} from '@angular/core';
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
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-saisie-credit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZXingScannerModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
  ],
  templateUrl: './saisie-credit.component.html',
  styleUrls: ['./saisie-credit.component.css'],
})
export class SaisieCreditComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scanner') scanner: any;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // États de l'application
  isScannerActive = false;
  isSubmitting = false;
  isProcessingScan = false;
  isLoadingCredit = false;
  hasPermission = false;
  isCameraInitialized = false;
  showSuccessModal = false;
  scannerReady = false;
  isTakingPhoto = false;

  // Données
  scannedVehicule: any = null;
  creditInfo: any = null;
  errorMessage = '';
  redirectSeconds = 5;
  currentUser: any = null;

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
    pricePerLiter: 10.5,
  };

  // Photo proof
  proofPhoto: File | null = null;
  proofPhotoName: string = '';
  proofPhotoPreview: string | null = null;

  constructor(
    private gestionCreditsService: GestionCreditsService,
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

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

  loadCurrentUser(): void {
    this.authService.getProfile().subscribe({
      next: data => {
        if (data && (Array.isArray(data) ? data[0] : data)) {
          this.currentUser = Array.isArray(data) ? data[0][0] || data[0] : data;
        }
      },
      error: err => {
        console.error('Erreur lors du chargement du profil utilisateur', err);
        this.toastr.error('Erreur lors du chargement du profil', 'Erreur');
        this.router.navigate(['/login']);
      },
    });
  }

  // Photo proof methods
  openCamera(): void {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      this.stopScanner();
      this.isScannerActive = false;
      this.isTakingPhoto = true;

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(stream => {
          this.showCameraPreview(stream);
        })
        .catch(err => {
          console.error("Erreur d'accès à la caméra:", err);
          this.toastr.error("Impossible d'accéder à la caméra", 'Erreur');
          this.openFileInput();
          this.isTakingPhoto = false;
        });
    } else {
      this.toastr.warning(
        "L'accès à la caméra n'est pas supporté sur cet appareil",
        'Avertissement'
      );
      this.openFileInput();
    }
  }

  showCameraPreview(stream: MediaStream): void {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'camera-preview-modal';
    previewContainer.style.position = 'fixed';
    previewContainer.style.top = '0';
    previewContainer.style.left = '0';
    previewContainer.style.width = '100%';
    previewContainer.style.height = '100%';
    previewContainer.style.backgroundColor = 'rgba(0,0,0,0.9)';
    previewContainer.style.zIndex = '1050';
    previewContainer.style.display = 'flex';
    previewContainer.style.flexDirection = 'column';
    previewContainer.style.alignItems = 'center';
    previewContainer.style.justifyContent = 'center';

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.style.maxWidth = '100%';
    video.style.maxHeight = '70vh';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';

    const captureButton = document.createElement('button');
    captureButton.className = 'btn btn-primary';
    captureButton.innerHTML = '<i class="bi bi-camera"></i> Prendre la photo';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-danger';
    cancelButton.innerHTML = '<i class="bi bi-x"></i> Annuler';

    buttonContainer.appendChild(captureButton);
    buttonContainer.appendChild(cancelButton);

    previewContainer.appendChild(video);
    previewContainer.appendChild(buttonContainer);
    document.body.appendChild(previewContainer);

    cancelButton.onclick = () => {
      stream.getTracks().forEach(track => track.stop());
      document.body.removeChild(previewContainer);
      this.isTakingPhoto = false;
    };

    captureButton.onclick = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          blob => {
            if (blob) {
              const file = new File(
                [blob],
                'photo_' + new Date().getTime() + '.jpg',
                { type: 'image/jpeg' }
              );
              this.handleCapturedPhoto(file);
            }
          },
          'image/jpeg',
          0.9
        );
      }

      stream.getTracks().forEach(track => track.stop());
      document.body.removeChild(previewContainer);
      this.isTakingPhoto = false;
    };
  }

  handleCapturedPhoto(file: File): void {
    this.proofPhoto = file;
    this.proofPhotoName = file.name;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.proofPhotoPreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  openFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.proofPhoto = input.files[0];
      this.proofPhotoName = this.proofPhoto.name;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.proofPhotoPreview = e.target.result;
      };
      reader.readAsDataURL(this.proofPhoto);
    }
  }

  removePhoto(): void {
    this.proofPhoto = null;
    this.proofPhotoName = '';
    this.proofPhotoPreview = null;
    if (this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // Scanner methods
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
    return devices.find(
      device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('arrière')
    );
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
        console.error("Erreur lors de l'arrêt du scanner:", error);
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
    this.gestionCreditsService
      .getVehiculeByImmatriculation(immatriculation)
      .subscribe({
        next: (response: any) => {
          if (!response?.success || !response?.data) {
            this.lastScannedData = null;
            throw new Error(response?.message || 'Données véhicule non reçues');
          }

          this.scannedVehicule = Array.isArray(response.data)
            ? response.data[0]
            : response.data;

          if (!this.scannedVehicule.id_credit) {
            this.isProcessingScan = false;
            this.lastScannedData = null;
            this.errorMessage = 'Aucun crédit associé à ce véhicule';
            this.toastr.error(this.errorMessage, 'Erreur');
            return;
          }

          this.loadCreditInfo(this.scannedVehicule.id_credit);
        },
        error: err => {
          this.lastScannedData = null;
          this.handleScanError(err);
        },
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
        this.creditInfo.credit_utilise =
          this.creditInfo.credit_utilise !== null
            ? parseFloat(this.creditInfo.credit_utilise)
            : 0;

        this.creditInfo.solde_disponible =
          this.creditInfo.solde_credit - this.creditInfo.credit_utilise;

        console.log('Credit info traité:', this.creditInfo);
      },
      error: creditError => {
        this.handleCreditError(creditError);
      },
    });
  }

  private handleCreditError(error: any): void {
    this.isProcessingScan = false;
    this.isLoadingCredit = false;
    this.lastScannedData = null;

    console.error('Erreur crédit:', error);

    this.errorMessage =
      error.error?.message ||
      error.message ||
      'Erreur lors de la récupération des informations de crédit';

    this.toastr.error(this.errorMessage, 'Erreur');
  }

  private handleScanError(error: any): void {
    this.isProcessingScan = false;
    this.isLoadingCredit = false;
    console.error('Erreur:', error);

    this.errorMessage =
      error instanceof Error
        ? error.message
        : error.error?.message ||
          'Erreur inconnue lors du traitement des données scannées';

    this.toastr.error(this.errorMessage, 'Erreur');
  }

  calculateQuantity(): void {
    if (this.transaction.amount && this.transaction.pricePerLiter) {
      this.transaction.quantity = parseFloat(
        (this.transaction.amount / this.transaction.pricePerLiter).toFixed(2)
      );
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

    if (!this.currentUser?.id) {
      this.errorMessage = 'Impossible de récupérer les informations du pompiste';
      this.toastr.error(this.errorMessage, 'Erreur');
      return;
    }

    console.log('ID Pompiste envoyé au backend:', this.currentUser.id);
    console.log('Données complètes du currentUser:', this.currentUser);

    if (!this.scannedVehicule) {
      this.errorMessage = 'Aucun véhicule scanné';
      this.toastr.error(this.errorMessage, 'Erreur');
      return;
    }

    if (!this.transaction.amount || !this.transaction.pricePerLiter) {
      this.errorMessage = 'Veuillez remplir le montant et le prix par litre';
      this.toastr.warning(this.errorMessage, 'Champs manquants');
      return;
    }

    const soldeDisponible = this.soldeDisponible;
    if (this.transaction.amount > soldeDisponible) {
      this.errorMessage = `Le montant saisi (${this.transaction.amount} DT) dépasse le solde disponible (${soldeDisponible} DT)`;
      this.toastr.error(this.errorMessage, 'Erreur');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('id_vehicule', this.scannedVehicule.id);
    formData.append('id_credit', this.scannedVehicule.id_credit);
    formData.append('quantite', this.transaction.quantity?.toString() || '0');
    formData.append('montant', this.transaction.amount?.toString() || '0');
    formData.append('id_pompiste', this.currentUser.id.toString());

    if (this.proofPhoto) {
      formData.append('preuve', this.proofPhoto);
    }

    this.gestionCreditsService.createTransaction(formData).subscribe({
      next: response => {
        this.isSubmitting = false;
        this.showSuccessModal = true;
        this.startCountdown();
      },
      error: err => {
        this.isSubmitting = false;
        console.error("Erreur lors de l'enregistrement:", err);

        if (err.status === 400) {
          this.errorMessage = 'Solde insuffisant pour effectuer cette transaction';
        } else {
          this.errorMessage =
            err.error?.message ||
            "Erreur lors de l'enregistrement de la transaction";
        }

        this.toastr.error(this.errorMessage, 'Erreur');
      },
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

    // Utilisez la navigation Angular pour rafraîchir le composant
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/saisie-credit']);
    });
  }

  resetForm(): void {
    this.transaction = {
      quantity: null,
      amount: null,
      pricePerLiter: 10.5,
    };
    this.scannedVehicule = null;
    this.creditInfo = null;
    this.isProcessingScan = false;
    this.errorMessage = '';
    this.lastScannedData = null;
    this.removePhoto();
  }
}
