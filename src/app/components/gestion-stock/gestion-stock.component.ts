import { Component, OnInit, HostListener } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GestionStockService } from '../../services/gestion-stock.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-gestion-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
  ],
  templateUrl: './gestion-stock.component.html',
  styleUrls: ['./gestion-stock.component.css'],
})
export class GestionStockComponent implements OnInit {
  activeTab = 'products';

  // Données
  products: any[] = [];
  filteredProducts: any[] = [];
  categories: any[] = [];
  movements: any[] = [];
  sales: any[] = [];
  filteredSales: any[] = [];
  users: any[] = [];
  cashiers: any[] = [];
  agents: any[] = [];
  saleDetails: any[] = [];
  selectedSale: any = null;
  selectedMovement: any = null;
  addedProduct: any = null;
  // Nouvelles données pour fournisseurs et commandes d'achat
  fournisseurs: any[] = [];
  filteredFournisseurs: any[] = [];
  commandesAchat: any[] = [];
  filteredCommandesAchat: any[] = [];
  lignesCommande: any[] = [];
  selectedCommande: any = null;
  editingFournisseur: any = null;
  editingCommande: any = null;

  // Nouvelles variables pour la gestion des lignes de commande
  tempLignesCommande: any[] = [];
  selectedProduct: any = null;
  productQuantity: number = 1;
  showCommandeDetails: boolean = false; // Filtres
  selectedCategory: string = '';
  selectedSupplier: string = '';
  stockFilter = 'all';
  searchTerm = '';
  movementTypeFilter = '';
  movementProductFilter = '';
  movementProductSearchTerm = ''; // Nouveau: pour l'autocomplétion des mouvements
  salesCaissierFilter = '';
  salesPaymentFilter = '';
  // Nouveaux filtres pour fournisseurs et commandes
  fournisseurSearchTerm = '';
  commandeStatusFilter = '';
  commandeFournisseurFilter = '';
  commandeSearchTerm = '';
  commandeStartDate = '';
  commandeEndDate = '';

  // Nouveaux filtres pour l'autocomplétion des produits
  categorySearchTerm = '';
  supplierSearchTerm = '';
  showCategoryDropdown = false;
  showSupplierDropdown = false;
  filteredCategories: any[] = [];
  filteredSuppliers: any[] = [];
  // Pour l'autocomplétion dans le modal de mouvement
  showMovementProductDropdown = false;
  filteredProductsForMovement: any[] = [];

  // Pour l'autocomplétion dans le modal de commande
  filteredCommandeProducts: any[] = [];
  showProductResults = false;
  productSearchTerm = '';

  // Pour l'autocomplétion des fournisseurs dans le modal de commande
  showSupplierResults = false;
  filteredSupplierOptions: any[] = [];

  // Dates
  startDate = '';
  endDate = '';
  salesStartDate = '';
  salesEndDate = '';
  // Pagination
  currentPage = 1;
  itemsPerPage = 8;
  currentSalesPage = 1;
  salesPerPage = 10;

  // Nouvelle pagination pour fournisseurs et commandes
  currentFournisseurPage = 1;
  fournisseursPerPage = 8;
  currentCommandePage = 1;
  commandesPerPage = 10;
  // Formulaires
  productForm: FormGroup;
  categoryForm: FormGroup;
  movementForm: FormGroup;

  // Nouveaux formulaires pour fournisseurs et commandes
  fournisseurForm: FormGroup;
  commandeAchatForm: FormGroup;

  // Nouveau formulaire pour l'inventaire
  inventaireForm: FormGroup;

  // Éditions
  editingProduct: any = null;
  editingCategory: any = null;

  // Inventaire
  selectedProductForInventory: any = null;
  stockReel: number = 0;
  ecart: number = 0;
  calculatedEcart: boolean = false;
  // Prévisualisation image
  productImagePreview: string | ArrayBuffer | null = null;
  productImageFile: File | null = null;

  // TVA pour les produits
  tvaRate: number = 7; // 7% par défaut
  // Statistiques
  stockValue = 0;
  totalProducts = 0;
  lowStockCount = 0;
  todaySales = 0;
  todaySalesCount = 0;
  totalSales = 0;
  totalCash = 0;
  totalCard = 0;
  totalCheck = 0;

  // État
  loading = false;
  currentUser: any = null;
  // Nouveaux états pour modals et messages
  showSuccessModal = false;
  showErrorModal = false;
  showConfirmModal = false;
  showConfirmDeleteModal = false;
  successMessage = '';
  errorMessage = '';
  confirmMessage = '';
  confirmDeleteMessage = '';
  confirmAction: (() => void) | null = null;
  pendingDeleteAction: (() => void) | null = null;
  // New properties for autocomplete functionality
  inventoryProductSearchTerm: string = '';
  filteredInventoryProducts: any[] = [];
  showCategoryResults: boolean = false;
  showInventoryProductResults: boolean = false;

  // New properties for command modal autocomplete
  productPrice: number = 0;
  productSaved$ = new Subject<boolean>();

  constructor(
    private stockService: GestionStockService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    // Initialisation des formulaires
    this.productForm = this.fb.group({
      id: [''],
      nom: ['', Validators.required],
      code_barre: ['', Validators.required],
      description: [''],
      categorie_id: [''], // Removed required validator
      fournisseur_id: [''],
      prix_achat: [0, [Validators.required, Validators.min(0)]],
      prix_vente: [0, [Validators.required, Validators.min(0)]],
      tva: [7, [Validators.required, Validators.min(0), Validators.max(100)]],
      quantite_stock: [0, [Validators.min(0)]],
      seuil_alerte: [0, [Validators.min(0)]],
      image_url: [''],
    });

    this.categoryForm = this.fb.group({
      id: [''],
      nom: ['', Validators.required],
      parent_id: [''],
    });
    this.movementForm = this.fb.group({
      id: [''],
      produit_id: ['', Validators.required],
      type: ['ENTREE', Validators.required],
      quantite: [1, [Validators.required, Validators.min(1)]],
      raison: [''],
      utilisateur_id: [''],
    });

    // Nouveaux formulaires
    this.fournisseurForm = this.fb.group({
      id: [''],
      nom: ['', Validators.required],
      contact: [''],
      telephone: [''],
      email: ['', Validators.email],
      adresse: [''],
    });
    this.commandeAchatForm = this.fb.group({
      id: [''],
      fournisseur_id: ['', Validators.required],
      montant_total: [0, [Validators.required, Validators.min(0)]],
      statut: ['brouillon', Validators.required],
      date_commande: [''],
      selectedProduct: [''], // Champ pour la sélection de produit
    });

    // Nouveau formulaire pour l'inventaire
    this.inventaireForm = this.fb.group({
      produit_id: ['', Validators.required],
      stock_reel: [0, [Validators.required, Validators.min(0)]],
      raison: [''],
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadInitialData();
    this.setupDateFilters();
  }

  loadUserProfile(): void {
    this.authService.getProfile().subscribe({
      next: data => {
        if (data && (Array.isArray(data) ? data[0] : data)) {
          this.currentUser = Array.isArray(data) ? data[0][0] || data[0] : data;
          this.movementForm.patchValue({ utilisateur_id: this.currentUser?.id });
          this.inventaireForm.patchValue({ utilisateur_id: this.currentUser?.id });
        }
      },
      error: err => {
        console.error('Profile load error:', err);
      },
    });
  }
  loadInitialData(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadUsers();
    this.loadMovements();
    this.loadSales();
    this.loadFournisseurs();
    this.loadCommandesAchat();
  }
  setupDateFilters(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.startDate = this.formatDate(today);
    this.endDate = this.formatDate(today);
    this.salesStartDate = this.formatDate(firstDay);
    this.salesEndDate = this.formatDate(today);
    this.commandeStartDate = this.formatDate(firstDay);
    this.commandeEndDate = this.formatDate(today);
  }

  parseNumber(value: any): number {
    if (typeof value === 'string') {
      return parseFloat(value.replace(',', '.').replace(/\s/g, ''));
    }
    return Number(value);
  }

  // ==================== CHARGEMENT DES DONNÉES ====================
  loadProducts(): void {
    this.loading = true;
    this.stockService.getAllProduits().subscribe({
      next: produits => {
        this.products = produits || [];
        this.filteredProducts = [...this.products];
        this.calculateStockStats();
        this.loading = false;
      },
      error: err => {
        console.error('Erreur lors du chargement des produits:', err);
        this.products = [];
        this.filteredProducts = [];
        this.loading = false;
      },
    });
  }

  loadCategories(): void {
    this.loading = true;
    this.stockService.getAllCategories().subscribe({
      next: categories => {
        this.categories = categories || [];
        this.loading = false;
      },
      error: err => {
        console.error('Erreur chargement catégories:', err);
        this.categories = [];
        this.loading = false;
      },
    });
  }
  loadMovements(): void {
    if (!this.startDate || !this.endDate) {
      console.error('Dates non définies pour le chargement des mouvements');
      return;
    }

    this.loading = true;
    this.stockService
      .getMouvementsByDate(this.startDate, this.endDate + ' 23:59:59')
      .subscribe({
        next: mouvements => {
          this.movements = mouvements || [];

          // Filtrer par type de mouvement
          if (this.movementTypeFilter) {
            this.movements = this.movements.filter(
              m => m.type === this.movementTypeFilter
            );
          }

          // Filtrer par produit avec recherche textuelle
          if (this.movementProductSearchTerm) {
            this.movements = this.movements.filter(m => {
              const product = this.products.find(p => p.id === m.produit_id);
              return (
                product &&
                product.nom
                  .toLowerCase()
                  .includes(this.movementProductSearchTerm.toLowerCase())
              );
            });
          }

          this.loading = false;
        },
        error: err => {
          console.error('Erreur chargement mouvements:', err);
          this.movements = [];
          this.loading = false;
        },
      });
  }

  loadSales(): void {
    this.loading = true;
    const formattedStartDate = this.salesStartDate || this.formatDate(new Date());
    const formattedEndDate = this.salesEndDate || this.formatDate(new Date());

    this.stockService
      .getVentesByDate(formattedStartDate, formattedEndDate + ' 23:59:59')
      .subscribe({
        next: ventes => {
          this.sales = ventes || [];
          this.filteredSales = [...this.sales];
          this.calculateSalesTotals();
          this.loading = false;
        },
        error: err => {
          console.error('Erreur chargement ventes:', err);
          this.sales = [];
          this.filteredSales = [];
          this.loading = false;
        },
      });
  }
  loadUsers(): void {
    this.stockService.getAllUsers().subscribe({
      next: users => {
        this.users = users || [];
        this.cashiers = this.users.filter(user => user.role === 'caissier');
        this.agents = this.users.filter(user =>
          ['gerant', 'cogerant', 'admin'].includes(user.role)
        );
      },
      error: err => {
        console.error('Erreur chargement utilisateurs:', err);
        this.users = [];
        this.cashiers = [];
        this.agents = [];
      },
    });
  }
  loadFournisseurs(): void {
    this.loading = true;
    console.log('Chargement des fournisseurs...');
    this.stockService.getAllFournisseurs().subscribe({
      next: (fournisseurs: any) => {
        console.log('Fournisseurs reçus:', fournisseurs);
        this.fournisseurs = fournisseurs || [];
        this.filteredFournisseurs = [...this.fournisseurs];
        this.loading = false;
        console.log('Fournisseurs chargés:', this.fournisseurs.length);
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des fournisseurs:', err);
        this.fournisseurs = [];
        this.filteredFournisseurs = [];
        this.loading = false;
      },
    });
  }
  loadCommandesAchat(): void {
    this.loading = true;
    const filters = {
      fournisseur_id: this.commandeFournisseurFilter || undefined,
      statut: this.commandeStatusFilter || undefined,
      startDate: this.commandeStartDate || undefined,
      endDate: this.commandeEndDate || undefined,
    };

    this.stockService.getAllCommandesAchat(filters).subscribe({
      next: (commandes: any) => {
        this.commandesAchat = commandes || [];
        this.filteredCommandesAchat = this.commandesAchat.filter(commande => {
          const matchesSearch =
            !this.commandeSearchTerm ||
            this.getFournisseurName(commande.fournisseur_id)
              .toLowerCase()
              .includes(this.commandeSearchTerm.toLowerCase());
          return matchesSearch;
        });
        this.loading = false;
        this.currentCommandePage = 1;
      },
      error: (err: any) => {
        console.error("Erreur lors du chargement des commandes d'achat:", err);
        this.commandesAchat = [];
        this.filteredCommandesAchat = [];
        this.loading = false;
      },
    });
  }

  clearCommandeDateFilters(): void {
    this.commandeStartDate = '';
    this.commandeEndDate = '';
    this.loadCommandesAchat();
  }

  // ==================== MÉTHODES UTILITAIRES ====================
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  calculateStockStats(): void {
    this.totalProducts = this.products.length;
    this.stockValue = this.products.reduce(
      (sum, product) =>
        sum +
        this.parseNumber(product.prix_achat) *
          this.parseNumber(product.quantite_stock),
      0
    );
    this.lowStockCount = this.products.filter(
      product =>
        this.parseNumber(product.quantite_stock) <=
        this.parseNumber(product.seuil_alerte)
    ).length;
  }
  filterProducts(): void {
    this.filteredProducts = this.products.filter(product => {
      const matchesSearch =
        !this.searchTerm ||
        product.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (product.code_barre &&
          product.code_barre.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesCategory =
        !this.selectedCategory || product.categorie_id == this.selectedCategory;

      const matchesSupplier =
        !this.selectedSupplier || product.fournisseur_id == this.selectedSupplier;

      let matchesStock = true;
      if (this.stockFilter === 'low') {
        matchesStock =
          this.parseNumber(product.quantite_stock) <=
          this.parseNumber(product.seuil_alerte);
      } else if (this.stockFilter === 'out') {
        matchesStock = this.parseNumber(product.quantite_stock) <= 0;
      }

      return matchesSearch && matchesCategory && matchesSupplier && matchesStock;
    });

    this.currentPage = 1;
  }
  clearProductFilters(): void {
    // Réinitialiser tous les filtres de produits
    this.searchTerm = '';
    this.categorySearchTerm = '';
    this.supplierSearchTerm = '';
    this.selectedCategory = '';
    this.selectedSupplier = '';
    this.stockFilter = 'all';
    this.showCategoryDropdown = false;
    this.showSupplierDropdown = false;

    // Recharger les produits filtrés
    this.filterProducts();
  }
  filterSales(): void {
    this.filteredSales = this.sales.filter(sale => {
      const matchesCaissier =
        !this.salesCaissierFilter || sale.id_caissier == this.salesCaissierFilter;

      const matchesPayment =
        !this.salesPaymentFilter || sale.mode_paiement === this.salesPaymentFilter;

      return matchesCaissier && matchesPayment;
    });

    this.calculateSalesTotals();
    this.currentSalesPage = 1;
  }

  calculateSalesTotals(): void {
    this.totalSales = this.filteredSales.reduce(
      (sum, sale) => sum + this.parseNumber(sale.montant_total),
      0
    );
    this.totalCash = this.filteredSales
      .filter(sale => sale.mode_paiement === 'ESPECES')
      .reduce((sum, sale) => sum + this.parseNumber(sale.montant_total), 0);
    this.totalCard = this.filteredSales
      .filter(sale => sale.mode_paiement === 'CARTE')
      .reduce((sum, sale) => sum + this.parseNumber(sale.montant_total), 0);
    this.totalCheck = this.filteredSales
      .filter(sale => sale.mode_paiement === 'CHEQUE')
      .reduce((sum, sale) => sum + this.parseNumber(sale.montant_total), 0);
  }
  changeTab(tab: string): void {
    this.activeTab = tab;
    switch (tab) {
      case 'products':
        if (this.products.length === 0) this.loadProducts();
        break;
      case 'categories':
        if (this.categories.length === 0) this.loadCategories();
        break;
      case 'movements':
        if (this.movements.length === 0) this.loadMovements();
        break;
      case 'sales':
        if (this.sales.length === 0) this.loadSales();
        break;
      case 'suppliers':
        // Toujours charger les fournisseurs pour afficher l'interface même si vide
        if (this.fournisseurs.length === 0) this.loadFournisseurs(); // Correction: vérifie fournisseurs
        break;
      case 'purchases':
        // Toujours charger les commandes pour afficher l'interface même si vide
        if (this.commandesAchat.length === 0) this.loadCommandesAchat(); // Correction: vérifie commandesAchat
        // Charger aussi les fournisseurs pour les dropdowns
        if (this.fournisseurs.length === 0) this.loadFournisseurs();
        break;
    }
  }
  // ==================== GESTION DES PRODUITS ====================
  openAddProductModal(): void {
    this.editingProduct = null;
    this.productForm.reset({
      code_barre: this.generateRandomBarcode(),
      prix_achat: 0,
      prix_vente: 0,
      tva: 7, // TVA par défaut
      quantite_stock: 0,
      seuil_alerte: 0,
    });
    this.productImagePreview = null;
    this.productImageFile = null;
    this.categorySearchTerm = '';
    this.supplierSearchTerm = '';
    this.openModal('productModal');
  }

  // Méthode pour calculer automatiquement le prix de vente
  calculatePrixVente(): void {
    const prixAchat = this.productForm.get('prix_achat')?.value || 0;
    const tva = this.productForm.get('tva')?.value || 0;

    if (prixAchat > 0 && tva >= 0) {
      const prixVente = prixAchat * (1 + tva / 100);
      this.productForm.patchValue({
        prix_vente: parseFloat(prixVente.toFixed(2)),
      });
    }
  }

  // Méthode appelée quand le prix d'achat change
  onPrixAchatChange(): void {
    this.calculatePrixVente();
  }

  // Méthode appelée quand la TVA change
  onTvaChange(): void {
    this.calculatePrixVente();
  }

  generateRandomBarcode(): string {
    const randomPart = Math.floor(
      100000000000 + Math.random() * 900000000000
    ).toString();
    return 'CB' + randomPart.substring(0, 10);
  }
  editProduct(product: any): void {
    this.editingProduct = product;
    this.productForm.patchValue({
      ...product,
      tva: product.tva || 7, // Valeur par défaut si pas de TVA
    });
    this.productImagePreview = product.image_url || null;
    this.productImageFile = null;

    // Set search terms for autocomplete fields
    const category = this.categories.find(c => c.id == product.categorie_id);
    this.categorySearchTerm = category ? category.nom : '';

    const supplier = this.fournisseurs.find(f => f.id == product.fournisseur_id);
    this.supplierSearchTerm = supplier ? supplier.nom : '';

    this.openModal('productModal');
  }

  onProductImageChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.productImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.productImagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
  saveProduct(): void {
    if (this.productForm.invalid) return;

    this.loading = true;
    const productData = this.productForm.value;

    if (this.editingProduct) {
      this.stockService
        .updateProduit(this.editingProduct.id, productData, this.productImageFile)
        .subscribe({
          next: () => {
            this.loadProducts();
            this.closeModal('productModal');
            this.loading = false;
            this.showSuccessMessage('Produit modifié avec succès');
            this.productSaved$.next(false);
          },
          error: err => {
            console.error('Erreur mise à jour produit:', err);
            this.loading = false;
            this.showErrorMessage('Erreur lors de la modification du produit');
            this.productSaved$.next(false);
          },
        });
    } else {
      this.stockService.createProduit(productData, this.productImageFile).subscribe({
        next: newProduct => {
          this.addedProduct = newProduct;
          this.loadProducts();
          this.closeModal('productModal');
          this.loading = false;

          // Vérifier si on est dans le contexte d'une commande
          const commandeModal = document.getElementById('commandeModal');
          const isFromCommande =
            commandeModal && commandeModal.classList.contains('show');

          if (isFromCommande) {
            // Si c'est depuis une commande, juste notifier le succès sans afficher le code-barre
            this.showSuccessMessage('Produit ajouté avec succès!');
            this.productSaved$.next(true);
            // Rafraîchir la liste des produits pour la sélection dans la commande
            this.loadProducts();
          } else {
            // Affichage normal avec code-barre pour les ajouts depuis la liste des produits
            this.showProductAddedSuccessWithBarcode();
            this.productSaved$.next(true);
          }
        },
        error: err => {
          console.error('Erreur création produit:', err);
          this.loading = false;
          this.showErrorMessage('Erreur lors de la création du produit');
          this.productSaved$.next(false);
        },
      });
    }
  }

  // Nouvelle méthode pour afficher le succès avec code-barre
  showProductAddedSuccessWithBarcode(): void {
    // Modifier le modal de code-barre pour inclure le message de succès
    this.openModal('barcodeModal');
    setTimeout(() => this.generateBarcode(), 100);
  }

  generateBarcode(): void {
    if (this.addedProduct?.code_barre) {
      try {
        const barcodeElement = document.getElementById('barcode');
        if (barcodeElement) {
          JsBarcode(barcodeElement, this.addedProduct.code_barre, {
            format: 'CODE128',
            lineColor: '#000',
            width: 2,
            height: 50,
            displayValue: true,
          });
        }
      } catch (e) {
        console.error('Erreur génération code-barre:', e);
      }
    }
  }
  // Ajoutez cette méthode pour permettre la régénération manuelle si besoin
  regenerateBarcode(): void {
    this.productForm.patchValue({
      code_barre: this.generateRandomBarcode(),
    });
  }
  printBarcode(): void {
    const printContent = document.getElementById('barcode');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svgClone = printContent.cloneNode(true) as SVGElement;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Code-barre ${this.addedProduct?.nom}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center;
              padding: 20px;
            }
            h3 { margin-bottom: 5px; }
            p { margin-top: 0; color: #555; }
            svg { 
              display: block;
              margin: 20px auto;
              max-width: 100%;
            }
          </style>
        </head>
        <body>
          <h3>${this.addedProduct?.nom}</h3>
          <p>Code: ${this.addedProduct?.code_barre}</p>
          ${svgClone.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 200);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
  confirmDelete(productId: number): void {
    this.confirmDeleteMessage =
      'Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.';
    this.pendingDeleteAction = () => this.deleteProduct(productId);
    this.showConfirmDeleteModal = true;
  }

  private deleteProduct(productId: number): void {
    this.loading = true;
    this.stockService.deleteProduit(productId).subscribe({
      next: () => {
        this.loadProducts();
        this.loading = false;
        this.showSuccessMessage('Produit supprimé avec succès');
      },
      error: err => {
        console.error('Erreur suppression produit:', err);
        this.loading = false;
        this.showErrorMessage('Erreur lors de la suppression du produit');
      },
    });
  }

  confirmDeleteAction(): void {
    if (this.pendingDeleteAction) {
      this.pendingDeleteAction();
      this.pendingDeleteAction = null;
    }
    this.showConfirmDeleteModal = false;
  }

  cancelDelete(): void {
    this.pendingDeleteAction = null;
    this.showConfirmDeleteModal = false;
  }

  // ==================== GESTION DES CATÉGORIES ====================
  startEditCategory(category: any): void {
    this.editingCategory = category;
    this.categoryForm.patchValue({
      id: category.id,
      nom: category.nom,
      parent_id: category.parent_id || null,
    });
  }

  cancelEdit(): void {
    this.editingCategory = null;
    this.categoryForm.reset();
  }
  saveCategory(): void {
    if (this.categoryForm.invalid) return;

    this.loading = true;
    const categoryData = this.categoryForm.value;

    if (this.editingCategory) {
      this.stockService
        .updateCategorie(this.editingCategory.id, categoryData)
        .subscribe({
          next: () => {
            this.loadCategories();
            this.cancelEdit();
            this.loading = false;
            this.showSuccessMessage('Catégorie modifiée avec succès');
          },
          error: err => {
            console.error('Erreur mise à jour catégorie:', err);
            this.loading = false;
            this.showErrorMessage('Erreur lors de la modification de la catégorie');
          },
        });
    } else {
      this.stockService.createCategorie(categoryData).subscribe({
        next: () => {
          this.loadCategories();
          this.categoryForm.reset();
          this.loading = false;
          this.showSuccessMessage('Catégorie ajoutée avec succès');
        },
        error: err => {
          console.error('Erreur création catégorie:', err);
          this.loading = false;
          this.showErrorMessage('Erreur lors de la création de la catégorie');
        },
      });
    }
  }
  deleteCategory(categoryId: number): void {
    this.confirmDeleteMessage =
      'Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.';
    this.pendingDeleteAction = () => this.executeCategoryDelete(categoryId);
    this.showConfirmDeleteModal = true;
  }

  private executeCategoryDelete(categoryId: number): void {
    this.loading = true;
    this.stockService.deleteCategorie(categoryId).subscribe({
      next: () => {
        this.loadCategories();
        this.loading = false;
        this.showSuccessMessage('Catégorie supprimée avec succès');
      },
      error: err => {
        console.error('Erreur suppression catégorie:', err);
        this.loading = false;
        this.showErrorMessage('Erreur lors de la suppression de la catégorie');
      },
    });
  }
  // ==================== GESTION DES MOUVEMENTS ====================
  openAddMovementModal(): void {
    this.movementForm.reset({
      type: 'ENTREE',
      quantite: 1,
      utilisateur_id: this.currentUser?.id || null,
    });
    this.movementProductSearchTerm = '';
    this.showMovementProductDropdown = false;
    this.filteredProductsForMovement = [];
    this.openModal('movementModal');
  }

  viewMovementDetails(movement: any): void {
    this.selectedMovement = movement;
    this.openModal('movementDetailsModal');
  }
  saveMovement(): void {
    if (this.movementForm.invalid) return;

    this.loading = true;
    const movementData = {
      produit_id: this.movementForm.value.produit_id,
      type: this.movementForm.value.type,
      quantite: this.movementForm.value.quantite,
      raison: this.movementForm.value.raison || null,
      agent_id: this.currentUser?.id || null,
    };

    this.stockService.createMouvement(movementData).subscribe({
      next: () => {
        this.loadMovements();
        this.loadProducts(); // Rafraîchir les stocks
        this.closeModal('movementModal');
        this.loading = false;
        this.showSuccessMessage('Mouvement de stock enregistré avec succès');
      },
      error: err => {
        console.error('Erreur création mouvement:', err);
        this.loading = false;
        this.showErrorMessage('Erreur lors de la création du mouvement de stock');
      },
    });
  }

  // ==================== GESTION DE L'INVENTAIRE ====================
  openInventoryModal(): void {
    this.selectedProductForInventory = null;
    this.stockReel = 0;
    this.ecart = 0;
    this.calculatedEcart = false;
    this.inventaireForm.reset();
    this.inventoryProductSearchTerm = '';
    this.openModal('inventoryModal');
  }

  onProductInventorySelect(): void {
    const productId = this.inventaireForm.get('produit_id')?.value;
    if (productId) {
      this.selectedProductForInventory = this.products.find(p => p.id == productId);
      this.stockReel = 0;
      this.ecart = 0;
      this.calculatedEcart = false;
      this.inventaireForm.patchValue({ stock_reel: 0 });
    }
  }

  onStockReelChange(): void {
    const stockReelValue = this.inventaireForm.get('stock_reel')?.value;
    if (
      this.selectedProductForInventory &&
      stockReelValue !== null &&
      stockReelValue !== undefined
    ) {
      this.stockReel = Number(stockReelValue);
      this.ecart =
        this.stockReel - Number(this.selectedProductForInventory.quantite_stock);
      this.calculatedEcart = true;

      // Mettre à jour automatiquement la raison
      const raison = `Inventaire - Écart: ${this.ecart > 0 ? '+' : ''}${this.ecart} dans le produit ${this.selectedProductForInventory.nom}`;
      this.inventaireForm.patchValue({ raison: raison });
    }
  }

  saveInventoryAdjustment(): void {
    if (
      this.inventaireForm.invalid ||
      !this.selectedProductForInventory ||
      !this.calculatedEcart
    ) {
      return;
    }

    this.loading = true;

    const adjustmentData = {
      produit_id: this.selectedProductForInventory.id,
      type: 'AJUSTEMENT',
      quantite: Math.abs(this.ecart),
      raison: this.inventaireForm.value.raison,
      agent_id: this.currentUser?.id || null,
      sens: this.ecart > 0 ? 'ENTREE' : 'SORTIE',
    };

    // D'abord créer le mouvement d'ajustement
    this.stockService.createMouvement(adjustmentData).subscribe({
      next: () => {
        // Ensuite mettre à jour directement le stock du produit
        const updateData = {
          ...this.selectedProductForInventory,
          quantite_stock: this.stockReel,
        };

        this.stockService
          .updateProduit(this.selectedProductForInventory.id, updateData, null)
          .subscribe({
            next: () => {
              this.loadProducts();
              this.loadMovements();
              this.closeModal('inventoryModal');
              this.loading = false;
              this.showSuccessMessage(
                "Ajustement d'inventaire effectué avec succès"
              );
            },
            error: err => {
              console.error('Erreur mise à jour stock produit:', err);
              this.loading = false;
              this.showErrorMessage('Erreur lors de la mise à jour du stock');
            },
          });
      },
      error: err => {
        console.error('Erreur création mouvement ajustement:', err);
        this.loading = false;
        this.showErrorMessage("Erreur lors de l'enregistrement de l'ajustement");
      },
    });
  }
  // Méthodes utilitaires pour les messages
  showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.showSuccessModal = true;
    setTimeout(() => {
      this.showSuccessModal = false;
    }, 3000);
  }

  showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showErrorModal = true;
    setTimeout(() => {
      this.showErrorModal = false;
    }, 3000);
  }
  // Méthode pour gérer le clic sur l'overlay des modals
  onModalOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.showSuccessModal = false;
      this.showErrorModal = false;
      this.showConfirmDeleteModal = false;
    }
  }

  // Méthode utilitaire pour Math.abs
  getAbsoluteValue(value: number): number {
    return Math.abs(value);
  }

  // ==================== GESTION DES VENTES ====================
  showSaleDetails(sale: any): void {
    this.selectedSale = sale;
    this.loading = true;

    this.stockService.getLignesVente(sale.id).subscribe({
      next: lignes => {
        this.saleDetails = lignes.map((item: any) => ({
          ...item,
          prix_unitaire: this.parseNumber(item.prix_unitaire),
          quantite: this.parseNumber(item.quantite),
        }));
        this.loading = false;
        this.openModal('saleDetailsModal');
      },
      error: err => {
        console.error('Erreur chargement détails vente:', err);
        this.loading = false;
      },
    });
  }

  printSale(): void {
    // Donnez le temps au DOM de se mettre à jour
    setTimeout(() => {
      const printContent = document.getElementById('receipt');
      if (!printContent || !this.selectedSale) return;

      // Créez une copie profonde du contenu
      const printContentClone = printContent.cloneNode(true) as HTMLElement;
      printContentClone.classList.remove('d-none');
      printContentClone.style.display = 'block';

      // Styles intégrés
      const styles = `
      <style>
        body { 
          font-family: Arial, sans-serif; 
          font-size: 14px;
          padding: 10px;
          max-width: 300px;
          margin: 0 auto;
        }
        h4 { 
          text-align: center;
          font-size: 18px;
          margin-bottom: 5px;
        }
        hr {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        .text-center { text-align: center; }
        .d-flex { display: flex; }
        .justify-content-between { justify-content: space-between; }
        .mb-1 { margin-bottom: 5px; }
        .mb-2 { margin-bottom: 10px; }
        .mb-3 { margin-bottom: 15px; }
        .mt-3 { margin-top: 15px; }
        .text-muted { color: #6c757d; }
        small { font-size: 12px; }
      </style>
    `;

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.open();
      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reçu de vente #${this.selectedSale.id}</title>
          ${styles}
        </head>
        <body>
          ${printContentClone.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                // Ne pas fermer immédiatement pour éviter les problèmes avec certains navigateurs
              }, 300);
            }
          </script>
        </body>
      </html>
    `);
      printWindow.document.close();
    }, 200);
  }

  printCommande(): void {
    // Donnez le temps au DOM de se mettre à jour
    setTimeout(() => {
      const printContent = document.getElementById('commande-receipt');
      if (!printContent || !this.selectedCommande) return;

      // Créez une copie profonde du contenu
      const printContentClone = printContent.cloneNode(true) as HTMLElement;
      printContentClone.classList.remove('d-none');
      printContentClone.style.display = 'block';

      // Styles intégrés
      const styles = `
      <style>
        body { 
          font-family: Arial, sans-serif; 
          font-size: 14px;
          padding: 10px;
          max-width: 400px;
          margin: 0 auto;
        }
        h4 { 
          text-align: center;
          font-size: 18px;
          margin-bottom: 5px;
        }
        hr {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        .text-center { text-align: center; }
        .d-flex { display: flex; }
        .justify-content-between { justify-content: space-between; }
        .mb-1 { margin-bottom: 5px; }
        .mb-2 { margin-bottom: 10px; }
        .mb-3 { margin-bottom: 15px; }
        .mt-3 { margin-top: 15px; }
        .text-muted { color: #6c757d; }
        small { font-size: 12px; }
      </style>
    `;

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.open();
      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bon de commande #${this.selectedCommande.id}</title>
          ${styles}
        </head>
        <body>
          ${printContentClone.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                // Ne pas fermer immédiatement pour éviter les problèmes avec certains navigateurs
              }, 300);
            }
          </script>
        </body>
      </html>
    `);
      printWindow.document.close();
    }, 200);
  }
  cancelSale(saleId: number): void {
    this.confirmDeleteMessage =
      'Êtes-vous sûr de vouloir annuler cette vente ? Cette action est irréversible.';
    this.pendingDeleteAction = () => this.executeSaleCancel(saleId);
    this.showConfirmDeleteModal = true;
  }

  private executeSaleCancel(saleId: number): void {
    this.loading = true;
    this.stockService.cancelVente(saleId).subscribe({
      next: () => {
        this.loadSales();
        this.loading = false;
        this.showSuccessMessage('Vente annulée avec succès');
      },
      error: err => {
        console.error('Erreur annulation vente:', err);
        this.loading = false;
        this.showErrorMessage("Erreur lors de l'annulation de la vente");
      },
    });
  }

  // ==================== HELPERS ====================
  getCategoryName(categoryId: number): string {
    if (!categoryId) return '';
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.nom : '';
  }

  getProductName(productId: number): string {
    if (!productId) return '';
    const product = this.products.find(p => p.id === productId);
    return product ? product.nom : '';
  }

  getUserName(userId: number): string {
    if (!userId) return '';
    const user = this.users.find(u => u.id === userId);
    return user ? user.username : '';
  }

  getCurrentDate(): string {
    return new Date().toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ==================== PAGINATION ====================
  get totalPages() {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  get totalSalesPages() {
    return Math.ceil(this.filteredSales.length / this.salesPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  changeSalesPage(page: number): void {
    if (page >= 1 && page <= this.totalSalesPages) {
      this.currentSalesPage = page;
    }
  }

  getPages(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  getSalesPages(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentSalesPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalSalesPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
  // ==================== GESTION DES MODALES ====================
  openModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';

      // Gestion spéciale pour le modal de produit ouvert depuis le modal de commande
      if (modalId === 'productModal') {
        const commandeModal = document.getElementById('commandeModal');
        if (commandeModal && commandeModal.classList.contains('show')) {
          // Le modal de commande est ouvert, donc on augmente le z-index du modal produit
          modal.style.zIndex = '1060';
          // Ne pas ajouter modal-open car déjà présent, mais ajouter un backdrop avec z-index plus élevé
          const backdrop = document.createElement('div');
          backdrop.classList.add('modal-backdrop', 'fade', 'show');
          backdrop.style.zIndex = '1055';
          backdrop.setAttribute('data-modal', 'productModal');
          document.body.appendChild(backdrop);
          return;
        }
      }

      document.body.classList.add('modal-open');
      const backdrop = document.createElement('div');
      backdrop.classList.add('modal-backdrop', 'fade', 'show');
      document.body.appendChild(backdrop);
    }
  }
  closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      // Remove the show class and fade out
      modal.classList.remove('show');
      modal.style.display = 'none';

      // Gestion spéciale pour la fermeture du modal de produit depuis le modal de commande
      if (modalId === 'productModal') {
        const commandeModal = document.getElementById('commandeModal');
        if (commandeModal && commandeModal.classList.contains('show')) {
          // Le modal de commande est encore ouvert
          modal.style.zIndex = ''; // Reset z-index
          // Supprimer seulement le backdrop du modal produit
          const productBackdrops = document.querySelectorAll(
            '[data-modal="productModal"]'
          );
          productBackdrops.forEach(backdrop => {
            backdrop.classList.remove('show');
            setTimeout(() => backdrop.remove(), 150);
          });
          // Clean up specific modal states
          this.editingProduct = null;
          this.productImagePreview = null;
          this.productImageFile = null;
          this.showProductResults = false;
          this.categorySearchTerm = '';
          this.supplierSearchTerm = '';
          return;
        }
      }

      // Remove modal-open from body
      document.body.classList.remove('modal-open');

      // Remove backdrop with fade animation
      const backdrops = document.getElementsByClassName('modal-backdrop');
      Array.from(backdrops).forEach(backdrop => {
        backdrop.classList.remove('show');
        setTimeout(() => backdrop.remove(), 150);
      }); // Clean up specific modal states
      if (modalId === 'productModal') {
        this.editingProduct = null;
        this.productImagePreview = null;
        this.productImageFile = null;
        this.showProductResults = false;
        this.categorySearchTerm = '';
        this.supplierSearchTerm = '';
      } else if (modalId === 'commandeModal') {
        // Only clean up if we're not opening another modal
        if (!this.productSaved$.observed) {
          this.editingCommande = null;
          this.selectedProduct = null;
          this.tempLignesCommande = [];
          this.showProductResults = false;
          this.productSearchTerm = '';
          this.supplierSearchTerm = '';
        }
      }
    }
  }

  // ==================== ACTIONS ====================
  refreshProducts(): void {
    this.loadProducts();
  }

  refreshSales(): void {
    this.loadSales();
  }
  refreshMovements(): void {
    this.loadMovements();
  }

  // ==================== GESTION DES FOURNISSEURS ====================
  filterFournisseurs(): void {
    this.filteredFournisseurs = this.fournisseurs.filter(fournisseur => {
      const matchesSearch =
        !this.fournisseurSearchTerm ||
        fournisseur.nom
          .toLowerCase()
          .includes(this.fournisseurSearchTerm.toLowerCase()) ||
        (fournisseur.contact &&
          fournisseur.contact
            .toLowerCase()
            .includes(this.fournisseurSearchTerm.toLowerCase())) ||
        (fournisseur.email &&
          fournisseur.email
            .toLowerCase()
            .includes(this.fournisseurSearchTerm.toLowerCase()));

      return matchesSearch;
    });

    this.currentFournisseurPage = 1;
  }

  openAddFournisseurModal(): void {
    this.editingFournisseur = null;
    this.fournisseurForm.reset();
    this.openModal('fournisseurModal');
  }

  editFournisseur(fournisseur: any): void {
    this.editingFournisseur = fournisseur;
    this.fournisseurForm.patchValue(fournisseur);
    this.openModal('fournisseurModal');
  }

  saveFournisseur(): void {
    if (this.fournisseurForm.invalid) return;

    this.loading = true;
    const fournisseurData = this.fournisseurForm.value;

    if (this.editingFournisseur) {
      this.stockService
        .updateFournisseur(this.editingFournisseur.id, fournisseurData)
        .subscribe({
          next: () => {
            this.loadFournisseurs();
            this.closeModal('fournisseurModal');
            this.loading = false;
            this.showSuccessMessage('Fournisseur modifié avec succès');
          },
          error: err => {
            console.error('Erreur mise à jour fournisseur:', err);
            this.loading = false;
            this.showErrorMessage('Erreur lors de la modification du fournisseur');
          },
        });
    } else {
      this.stockService.createFournisseur(fournisseurData).subscribe({
        next: () => {
          this.loadFournisseurs();
          this.closeModal('fournisseurModal');
          this.loading = false;
          this.showSuccessMessage('Fournisseur ajouté avec succès');
        },
        error: err => {
          console.error('Erreur création fournisseur:', err);
          this.loading = false;
          this.showErrorMessage('Erreur lors de la création du fournisseur');
        },
      });
    }
  }
  deleteFournisseur(fournisseurId: number): void {
    this.confirmDeleteMessage =
      'Êtes-vous sûr de vouloir supprimer ce fournisseur ? Cette action est irréversible.';
    this.pendingDeleteAction = () => this.executeFournisseurDelete(fournisseurId);
    this.showConfirmDeleteModal = true;
  }

  private executeFournisseurDelete(fournisseurId: number): void {
    this.loading = true;
    this.stockService.deleteFournisseur(fournisseurId).subscribe({
      next: () => {
        this.loadFournisseurs();
        this.loading = false;
        this.showSuccessMessage('Fournisseur supprimé avec succès');
      },
      error: err => {
        console.error('Erreur suppression fournisseur:', err);
        this.loading = false;
        this.showErrorMessage('Erreur lors de la suppression du fournisseur');
      },
    });
  }
  // ==================== GESTION DES COMMANDES D'ACHAT ====================
  filterCommandesAchat(): void {
    // Maintenant on recharge depuis le backend avec tous les filtres
    this.loadCommandesAchat();
  }
  openAddCommandeModal(): void {
    this.editingCommande = null;
    this.selectedCommande = null;
    this.tempLignesCommande = [];
    this.selectedProduct = null;
    this.productQuantity = 1;
    this.showCommandeDetails = false;
    this.commandeAchatForm.reset({
      statut: 'brouillon',
      date_commande: this.formatDate(new Date()),
      montant_total: 0,
    });
    this.openModal('commandeModal');
  }
  editCommande(commande: any): void {
    this.editingCommande = commande;
    this.selectedCommande = commande;
    this.loadLignesCommande(commande.id);
    this.commandeAchatForm.patchValue({
      ...commande,
      date_commande: commande.date_commande
        ? commande.date_commande.split(' ')[0]
        : '',
    });
    this.openModal('commandeModal');
  }
  deleteCommande(commandeId: number): void {
    this.confirmDeleteMessage =
      'Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.';
    this.pendingDeleteAction = () => this.executeCommandeDelete(commandeId);
    this.showConfirmDeleteModal = true;
  }

  private executeCommandeDelete(commandeId: number): void {
    this.loading = true;
    this.stockService.deleteCommandeAchat(commandeId).subscribe({
      next: () => {
        this.loadCommandesAchat();
        this.loading = false;
        this.showSuccessMessage('Commande supprimée avec succès');
      },
      error: err => {
        console.error('Erreur suppression commande:', err);
        this.loading = false;
        this.showErrorMessage('Erreur lors de la suppression de la commande');
      },
    });
  }
  validerCommande(commandeId: number): void {
    this.confirmDeleteMessage =
      'Êtes-vous sûr de vouloir valider cette commande ? Cette action modifiera le statut de la commande.';
    this.pendingDeleteAction = () => this.executeCommandeValidation(commandeId);
    this.showConfirmDeleteModal = true;
  }

  private executeCommandeValidation(commandeId: number): void {
    this.loading = true;
    this.stockService
      .validerCommandeAchat(commandeId, this.currentUser?.id)
      .subscribe({
        next: () => {
          this.loadCommandesAchat();
          this.loading = false;
          this.showSuccessMessage('Commande validée avec succès');
        },
        error: err => {
          console.error('Erreur validation commande:', err);
          this.loading = false;
          this.showErrorMessage('Erreur lors de la validation de la commande');
        },
      });
  }
  recevoirCommande(commandeId: number): void {
    this.confirmDeleteMessage =
      'Êtes-vous sûr de vouloir marquer cette commande comme reçue ? Cette action mettra à jour les stocks.';
    this.pendingDeleteAction = () => this.executeCommandeReception(commandeId);
    this.showConfirmDeleteModal = true;
  }

  private executeCommandeReception(commandeId: number): void {
    this.loading = true;
    this.stockService
      .recevoirCommandeAchat(commandeId, this.currentUser?.id)
      .subscribe({
        next: () => {
          this.loadCommandesAchat();
          this.loadProducts(); // Rafraîchir les stocks après réception
          this.loading = false;
          this.showSuccessMessage('Commande marquée comme reçue');
        },
        error: err => {
          console.error('Erreur réception commande:', err);
          this.loading = false;
          this.showErrorMessage('Erreur lors de la réception de la commande');
        },
      });
  }
  annulerCommande(commandeId: number): void {
    this.confirmDeleteMessage =
      'Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.';
    this.pendingDeleteAction = () => this.executeCommandeAnnulation(commandeId);
    this.showConfirmDeleteModal = true;
  }

  private executeCommandeAnnulation(commandeId: number): void {
    this.loading = true;
    this.stockService
      .annulerCommandeAchat(commandeId, this.currentUser?.id)
      .subscribe({
        next: () => {
          this.loadCommandesAchat();
          this.loading = false;
          this.showSuccessMessage('Commande annulée avec succès');
        },
        error: err => {
          console.error('Erreur annulation commande:', err);
          this.loading = false;
          this.showErrorMessage("Erreur lors de l'annulation de la commande");
        },
      });
  }
  getFournisseurName(fournisseurId: number): string {
    if (!fournisseurId) return '';
    const fournisseur = this.fournisseurs.find(f => f.id === fournisseurId);
    return fournisseur ? fournisseur.nom : '';
  }
  getAgentName(agentId: number): string {
    if (!agentId) return 'Agent inconnu';
    const agent = this.users.find(u => u.id === agentId);
    return agent ? agent.username : 'Agent inconnu';
  }

  // ==================== MÉTHODES D'AUTOCOMPLÉTION POUR LES COMMANDES ====================

  selectCommandeSupplier(supplier: any): void {
    this.commandeAchatForm.patchValue({ fournisseur_id: supplier.id });
    this.supplierSearchTerm = supplier.nom;
    this.showSupplierResults = false;
  }
  filterCommandeProducts(): void {
    if (!this.productSearchTerm) {
      this.filteredCommandeProducts = [];
      this.showProductResults = false;
    } else {
      this.filteredCommandeProducts = this.products
        .filter(
          product =>
            product.nom
              .toLowerCase()
              .includes(this.productSearchTerm.toLowerCase()) ||
            (product.code_barre &&
              product.code_barre
                .toLowerCase()
                .includes(this.productSearchTerm.toLowerCase()))
        )
        .slice(0, 10); // Limiter à 10 résultats
      this.showProductResults = this.filteredCommandeProducts.length > 0;
    }
  }

  selectCommandeProduct(product: any): void {
    this.selectedProduct = product;
    this.productSearchTerm = product.nom;
    this.productPrice = product.prix_achat || 0;
    this.showProductResults = false;
  }

  // ==================== PAGINATION FOURNISSEURS ET COMMANDES ====================
  get totalFournisseurPages() {
    return Math.ceil(this.filteredFournisseurs.length / this.fournisseursPerPage);
  }

  get totalCommandePages() {
    return Math.ceil(this.filteredCommandesAchat.length / this.commandesPerPage);
  }

  changeFournisseurPage(page: number): void {
    if (page >= 1 && page <= this.totalFournisseurPages) {
      this.currentFournisseurPage = page;
    }
  }

  changeCommandePage(page: number): void {
    if (page >= 1 && page <= this.totalCommandePages) {
      this.currentCommandePage = page;
    }
  }

  getFournisseurPages(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(
      1,
      this.currentFournisseurPage - Math.floor(maxVisible / 2)
    );
    let end = Math.min(this.totalFournisseurPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  getCommandePages(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentCommandePage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalCommandePages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  refreshFournisseurs(): void {
    this.loadFournisseurs();
  }
  refreshCommandes(): void {
    this.loadCommandesAchat();
  } // ==================== GESTION DES LIGNES DE COMMANDE ====================
  addProductToCommande(): void {
    if (!this.selectedProduct || this.productQuantity <= 0) return;

    const existingLine = this.tempLignesCommande.find(
      ligne => ligne.produit_id === this.selectedProduct.id
    );

    if (existingLine) {
      existingLine.quantite += this.productQuantity;
      existingLine.prix_unitaire = this.selectedProduct.prix_achat;
    } else {
      this.tempLignesCommande.push({
        produit_id: this.selectedProduct.id,
        produit_nom: this.selectedProduct.nom,
        quantite: this.productQuantity,
        prix_unitaire: this.selectedProduct.prix_achat || 0,
      });
    }

    this.calculateMontantTotal();
    this.selectedProduct = null;
    this.productSearchTerm = '';
    this.productQuantity = 1;
  }

  removeProductFromCommande(index: number): void {
    this.tempLignesCommande.splice(index, 1);
    this.calculateMontantTotal();
  }

  calculateMontantTotal(): void {
    const total = this.tempLignesCommande.reduce(
      (sum, ligne) => sum + ligne.quantite * ligne.prix_unitaire,
      0
    );
    this.commandeAchatForm.patchValue({ montant_total: total });
  }

  onProductSelect(): void {
    const productId = this.commandeAchatForm.get('selectedProduct')?.value;
    this.selectedProduct = this.products.find(p => p.id == productId);
  }
  updateStatutCommande(commande: any, newStatut: string): void {
    // Si le statut n'a pas changé, ne rien faire
    if (commande.statut === newStatut) return;

    this.loading = true;

    let serviceCall;
    // Utiliser les endpoints spécifiques selon le nouveau statut
    switch (newStatut) {
      case 'validée':
        serviceCall = this.stockService.validerCommandeAchat(
          commande.id,
          this.currentUser?.id
        );
        break;
      case 'reçue':
        serviceCall = this.stockService.recevoirCommandeAchat(
          commande.id,
          this.currentUser?.id
        );
        break;
      case 'annulée':
        serviceCall = this.stockService.annulerCommandeAchat(
          commande.id,
          this.currentUser?.id
        );
        break;
      default:
        // Pour le statut 'brouillon' ou autres, utiliser l'update générique avec seulement le statut
        serviceCall = this.stockService.updateCommandeAchat(commande.id, {
          statut: newStatut,
        });
        break;
    }

    serviceCall.subscribe({
      next: () => {
        // Mettre à jour localement le statut
        commande.statut = newStatut;
        this.loading = false;
        this.showSuccessMessage(
          `Statut mis à jour vers ${this.getStatutLabel(newStatut)}`
        );

        // Rafraîchir les stocks si la commande a été reçue
        if (newStatut === 'reçue') {
          this.loadProducts();
        }

        // Recharger les commandes pour avoir les données à jour
        this.loadCommandesAchat();
      },
      error: err => {
        console.error('Erreur mise à jour statut:', err);
        this.loading = false;
        this.showErrorMessage('Erreur lors de la mise à jour du statut');
        // Recharger les commandes pour réinitialiser l'état
        this.loadCommandesAchat();
      },
    });
  }

  // Méthode utilitaire pour afficher les libellés des statuts
  getStatutLabel(statut: string): string {
    const statuts: any = {
      brouillon: 'Brouillon',
      validée: 'Validée',
      reçue: 'Reçue',
      annulée: 'Annulée',
    };
    return statuts[statut] || statut;
  }

  loadLignesCommande(commandeId: number): void {
    this.stockService.getLignesCommande(commandeId).subscribe({
      next: lignes => {
        this.tempLignesCommande = lignes || [];
      },
      error: err => {
        console.error('Erreur chargement lignes commande:', err);
        this.tempLignesCommande = [];
      },
    });
  }
  viewCommandeDetails(commande: any): void {
    this.selectedCommande = commande;
    this.loading = true;

    // Charger les lignes de commande
    this.stockService.getLignesCommande(commande.id).subscribe({
      next: lignes => {
        this.selectedCommande.lignes = lignes || [];
        this.loading = false;
        this.openModal('commandeDetailsModal');
      },
      error: err => {
        console.error('Erreur chargement détails commande:', err);
        this.selectedCommande.lignes = [];
        this.loading = false;
        this.showErrorMessage(
          'Erreur lors du chargement des détails de la commande'
        );
        this.openModal('commandeDetailsModal');
      },
    });
  }

  saveCommande(): void {
    if (this.editingCommande) {
      // Mode édition - utiliser les données du formulaire directement
      this.saveCommandeWithLines();
    } else {
      // Mode création - utiliser la méthode saveCommandeWithLines
      this.saveCommandeWithLines();
    }
  }

  saveCommandeWithLines(): void {
    if (this.commandeAchatForm.invalid) {
      this.showErrorMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!this.editingCommande && this.tempLignesCommande.length === 0) {
      this.showErrorMessage('Veuillez ajouter au moins un produit à la commande');
      return;
    }

    this.loading = true;
    const commandeData = {
      ...this.commandeAchatForm.value,
      agent_id: this.currentUser?.id,
      produits: this.tempLignesCommande.map(ligne => ({
        produit_id: ligne.produit_id,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
      })),
    };

    // Nettoyer le champ selectedProduct qui n'est pas nécessaire pour l'API
    delete commandeData.selectedProduct;

    if (this.editingCommande) {
      this.stockService
        .updateCommandeAchat(this.editingCommande.id, commandeData)
        .subscribe({
          next: () => {
            this.loadCommandesAchat();
            this.closeModal('commandeModal');
            this.loading = false;
            this.showSuccessMessage('Commande modifiée avec succès');
          },
          error: err => {
            console.error('Erreur mise à jour commande:', err);
            this.loading = false;
            this.showErrorMessage('Erreur lors de la modification de la commande');
          },
        });
    } else {
      this.stockService.createCommandeAchat(commandeData).subscribe({
        next: () => {
          this.loadCommandesAchat();
          this.closeModal('commandeModal');
          this.loading = false;
          this.showSuccessMessage('Commande créée avec succès');
        },
        error: err => {
          console.error('Erreur création commande:', err);
          this.loading = false;
          this.showErrorMessage('Erreur lors de la création de la commande');
        },
      });
    }
  } // Méthodes pour afficher les détails des commandes
  showCommandeDetailsModal(commande: any): void {
    this.viewCommandeDetails(commande);
  }

  updateLigneQuantity(ligne: any): void {
    if (ligne.quantite <= 0) {
      const index = this.tempLignesCommande.indexOf(ligne);
      this.removeProductFromCommande(index);
    } else {
      this.calculateMontantTotal();
    }
  }

  // Filter methods for category autocomplete
  filterCategories(): void {
    if (!this.categorySearchTerm) {
      this.filteredCategories = [...this.categories];
    } else {
      this.filteredCategories = this.categories.filter(c =>
        c.nom.toLowerCase().includes(this.categorySearchTerm.toLowerCase())
      );
    }
    this.showCategoryResults = true;
  }

  selectCategory(category: any): void {
    this.productForm.patchValue({ categorie_id: category.id });
    this.categorySearchTerm = category.nom;
    this.showCategoryResults = false;
  }

  // Filter methods for supplier autocomplete
  filterSuppliers(): void {
    if (!this.supplierSearchTerm) {
      this.filteredSupplierOptions = [...this.fournisseurs];
    } else {
      this.filteredSupplierOptions = this.fournisseurs.filter(f =>
        f.nom.toLowerCase().includes(this.supplierSearchTerm.toLowerCase())
      );
    }
    this.showSupplierResults = true;
  }

  selectSupplier(supplier: any): void {
    this.productForm.patchValue({ fournisseur_id: supplier.id });
    this.supplierSearchTerm = supplier.nom;
    this.showSupplierResults = false;
  }

  // Methods for inventory product autocomplete
  filterInventoryProducts(): void {
    if (!this.inventoryProductSearchTerm) {
      this.filteredInventoryProducts = [...this.products];
    } else {
      this.filteredInventoryProducts = this.products.filter(
        p =>
          p.nom
            .toLowerCase()
            .includes(this.inventoryProductSearchTerm.toLowerCase()) ||
          (p.code_barre &&
            p.code_barre
              .toLowerCase()
              .includes(this.inventoryProductSearchTerm.toLowerCase()))
      );
    }
  }

  selectInventoryProduct(product: any): void {
    this.inventaireForm.patchValue({ produit_id: product.id });
    this.inventoryProductSearchTerm = product.nom;
    this.showInventoryProductResults = false;
    this.selectedProductForInventory = product;
    this.stockReel = 0;
    this.ecart = 0;
    this.calculatedEcart = false;
  }

  // Method to trigger file input click when image area is clicked
  triggerFileInput(): void {
    const fileInputElement = document.querySelector(
      'input[type="file"]'
    ) as HTMLElement;
    if (fileInputElement) {
      fileInputElement.click();
    }
  }

  // Method to trigger file input click and set up editing product
  triggerImageUpload(event: Event, product: any): void {
    // Stop event propagation to prevent opening edit modal
    event.stopPropagation();

    // Set up editing product
    this.editingProduct = product;
    this.productImagePreview = product.image_url || null;
    this.productImageFile = null;

    // Trigger file input click
    const fileInput = document.querySelector('input[type="file"]') as HTMLElement;
    if (fileInput) {
      fileInput.click();
    }
  } // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (
      !event.target.closest('.autocomplete-container') &&
      !event.target.closest('.input-group') &&
      !event.target.closest('.dropdown-menu') &&
      !event.target.closest('.position-relative')
    ) {
      this.showCategoryResults = false;
      this.showSupplierResults = false;
      this.showInventoryProductResults = false;
      this.showProductResults = false;
      this.showCategoryDropdown = false;
      this.showSupplierDropdown = false;
      this.showMovementProductDropdown = false;
    }
  }

  // ==================== NOUVELLES MÉTHODES D'AUTOCOMPLÉTION ====================
  filterProductsByCategory(): void {
    if (!this.categorySearchTerm) {
      this.filteredCategories = [];
      this.showCategoryDropdown = false;
      this.selectedCategory = '';
    } else {
      this.filteredCategories = this.categories.filter(cat =>
        cat.nom.toLowerCase().includes(this.categorySearchTerm.toLowerCase())
      );
      this.showCategoryDropdown = this.filteredCategories.length > 0;
    }
    this.filterProducts();
  }

  selectCategoryFilter(category: any): void {
    this.selectedCategory = category.id;
    this.categorySearchTerm = category.nom;
    this.showCategoryDropdown = false;
    this.filterProducts();
  }

  filterProductsBySupplier(): void {
    if (!this.supplierSearchTerm) {
      this.filteredSuppliers = [];
      this.showSupplierDropdown = false;
      this.selectedSupplier = '';
    } else {
      this.filteredSuppliers = this.fournisseurs.filter(supplier =>
        supplier.nom.toLowerCase().includes(this.supplierSearchTerm.toLowerCase())
      );
      this.showSupplierDropdown = this.filteredSuppliers.length > 0;
    }
    this.filterProducts();
  }

  selectSupplierFilter(supplier: any): void {
    this.selectedSupplier = supplier.id;
    this.supplierSearchTerm = supplier.nom;
    this.showSupplierDropdown = false;
    this.filterProducts();
  }

  filterMovementsByProduct(): void {
    this.loadMovements();
  }
  filterProductsForMovement(): void {
    if (!this.movementProductSearchTerm) {
      this.filteredProductsForMovement = [];
      this.showMovementProductDropdown = false;
    } else {
      this.filteredProductsForMovement = this.products
        .filter(
          product =>
            product.nom
              .toLowerCase()
              .includes(this.movementProductSearchTerm.toLowerCase()) ||
            (product.code_barre &&
              product.code_barre
                .toLowerCase()
                .includes(this.movementProductSearchTerm.toLowerCase()))
        )
        .slice(0, 10);
      this.showMovementProductDropdown = true; // Toujours afficher le dropdown quand on recherche
    }
  }
  selectProductForMovement(product: any): void {
    this.movementForm.patchValue({ produit_id: product.id });
    this.movementProductSearchTerm = product.nom;
    this.showMovementProductDropdown = false;
  }
  // Méthodes pour l'autocomplétion dans le modal de commande
  filterSuppliersForCommande(): void {
    if (!this.supplierSearchTerm) {
      this.filteredSupplierOptions = [];
      this.showSupplierResults = false;
    } else {
      this.filteredSupplierOptions = this.fournisseurs.filter(supplier =>
        supplier.nom.toLowerCase().includes(this.supplierSearchTerm.toLowerCase())
      );
      this.showSupplierResults = this.filteredSupplierOptions.length > 0;
    }
  }
  // ==================== MÉTHODES D'EXPORT EXCEL ====================
  exportMovementsToExcel(): void {
    try {
      // Utiliser les mouvements déjà filtrés et affichés dans le tableau
      let dataToExport = [...this.movements];

      // Si pas de données filtrées, charger tous les mouvements
      if (dataToExport.length === 0) {
        // Utiliser une plage de dates large pour récupérer tous les mouvements
        const startDate = '2020-01-01'; // Date très ancienne
        const endDate = new Date().toISOString().split('T')[0]; // Date d'aujourd'hui

        this.stockService.getMouvementsByDate(startDate, endDate).subscribe({
          next: allMovements => {
            this.exportMovementsData(allMovements);
          },
          error: err => {
            console.error('Erreur lors du chargement des mouvements:', err);
            this.showErrorMessage(
              'Erreur lors du chargement des données à exporter'
            );
          },
        });
        return;
      }

      this.exportMovementsData(dataToExport);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      this.showErrorMessage("Erreur lors de l'export Excel");
    }
  }

  private exportMovementsData(dataToExport: any[]): void {
    try {
      // Transformer les données pour l'export
      const exportData = dataToExport.map(movement => ({
        ID: movement.id,
        Date: new Date(movement.date_mouvement).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        Produit: this.getProductName(movement.produit_id),
        Type: movement.type,
        Quantité: movement.quantite,
        Responsable: movement.agent_username || movement.agent_nom || 'N/A',
        Raison: movement.raison || '-',
      }));

      // Créer le workbook
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();

      // Ajouter des styles aux en-têtes
      const range = XLSX.utils.decode_range(ws['!ref']!);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'CCCCCC' } },
        };
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Mouvements');

      // Générer le nom du fichier avec la date
      const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const filename = `mouvements-stock-${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);

      this.showSuccessMessage(
        `Export Excel réalisé avec succès ! ${exportData.length} mouvements exportés.`
      );
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      this.showErrorMessage("Erreur lors de l'export Excel");
    }
  }
  exportCommandesToExcel(): void {
    try {
      // Préparer les données avec les filtres appliqués
      let dataToExport = [...this.filteredCommandesAchat];

      // Transformer les données pour l'export (enlever le champ Date Création)
      const exportData = dataToExport.map(commande => ({
        ID: commande.id,
        Fournisseur: this.getFournisseurName(commande.fournisseur_id),
        'Date Commande': new Date(commande.date_commande).toLocaleDateString(
          'fr-FR'
        ),
        'Montant Total (DT)': commande.montant_total,
        Statut: commande.statut,
        Responsable: commande.agent_nom,
      }));

      // Créer le workbook
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();

      // Ajouter des styles aux en-têtes
      const range = XLSX.utils.decode_range(ws['!ref']!);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'CCCCCC' } },
        };
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Commandes');

      // Générer le nom du fichier avec la date
      const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const filename = `commandes-achat-${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);

      this.showSuccessMessage('Export Excel réalisé avec succès !');
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      this.showErrorMessage("Erreur lors de l'export Excel");
    }
  }
  exportSalesToExcel(): void {
    try {
      // Préparer les données avec les filtres appliqués
      let dataToExport = [...this.filteredSales];

      // Transformer les données pour l'export (enlever Statut et Nombre Articles)
      const exportData = dataToExport.map(sale => ({
        'N° Vente': sale.id,
        Date: new Date(sale.date_vente).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        Caissier: this.getUserName(sale.id_caissier),
        'Montant Total (DT)': sale.montant_total,
        'Mode Paiement': sale.mode_paiement,
      }));

      // Créer le workbook
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();

      // Ajouter des styles aux en-têtes
      const range = XLSX.utils.decode_range(ws['!ref']!);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'CCCCCC' } },
        };
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Ventes');

      // Générer le nom du fichier avec la date
      const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const filename = `ventes-${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);

      this.showSuccessMessage('Export Excel réalisé avec succès !');
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      this.showErrorMessage("Erreur lors de l'export Excel");
    }
  }
}
