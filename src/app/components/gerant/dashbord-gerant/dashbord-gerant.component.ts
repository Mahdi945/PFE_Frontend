import { Component, OnInit, AfterViewInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { Chart, registerables } from 'chart.js';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FooterComponent } from '../../footer/footer.component';

@Component({
  selector: 'app-dashbord-gerant',
  standalone: true,
  imports: [NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './dashbord-gerant.component.html',
  styleUrls: ['./dashbord-gerant.component.css']
})
export class DashbordGerantComponent implements OnInit, AfterViewInit {
  public users: any[] = [];
  public filteredUsers: any[] = [];
  public userStatsChart!: Chart;
  public activeUsersChart!: Chart;
  public selectedFilter: string = 'day';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    Chart.register(...registerables);
    this.fetchUsers();
  }

  ngAfterViewInit(): void {
    this.createEmptyCharts();
  }

  fetchUsers(): void {
    this.userService.getAllUsers().subscribe(data => {
      this.users = data;
      this.filterData(this.selectedFilter);
    });
  }

  filterData(timePeriod: string): void {
    const today = new Date();
    let filtered = [];
  
    if (timePeriod === 'day') {
      filtered = this.users.filter(user => {
        const userDate = new Date(user.temps_de_creation);
        return (
          userDate.getDate() === today.getDate() &&
          userDate.getMonth() === today.getMonth() &&
          userDate.getFullYear() === today.getFullYear()
        );
      });
    } else if (timePeriod === 'month') {
      filtered = this.users.filter(user => {
        const userDate = new Date(user.temps_de_creation);
        return (
          userDate.getMonth() === today.getMonth() &&
          userDate.getFullYear() === today.getFullYear()
        );
      });
    } else if (timePeriod === 'year') {
      filtered = this.users.filter(user => {
        const userDate = new Date(user.temps_de_creation);
        return userDate.getFullYear() === today.getFullYear();
      });
    }
  
    this.selectedFilter = timePeriod;
    this.filteredUsers = filtered;
    this.updateCharts();
  }

  createEmptyCharts(): void {
    const userStatsCanvas = document.getElementById('userStatsChart') as HTMLCanvasElement;
    const activeUsersCanvas = document.getElementById('activeUsersChart') as HTMLCanvasElement;

    if (userStatsCanvas) {
      this.userStatsChart = new Chart(userStatsCanvas, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Users per Role',
            data: [],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // Assurer une taille plus petite
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    if (activeUsersCanvas) {
      this.activeUsersChart = new Chart(activeUsersCanvas, {
        type: 'pie',
        data: {
          labels: ['Active', 'Inactive'],
          datasets: [{ data: [0, 0], backgroundColor: ['#4BC0C0', '#FF6384'] }]
        },
        options: { 
          responsive: true,
          maintainAspectRatio: false // Pour éviter une taille trop grande
        }
      });
    }
  }

  updateCharts(): void {
    this.updateUserStatsChart();
    this.updateActiveUsersChart();
  }

  updateUserStatsChart(): void {
    if (!this.userStatsChart) return;

    const roles = this.filteredUsers.map(user => user.role);
    const roleCounts = roles.reduce((acc: { [key: string]: number }, role: string) => {
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    this.userStatsChart.data.labels = Object.keys(roleCounts);
    this.userStatsChart.data.datasets[0].data = Object.values(roleCounts);
    this.userStatsChart.update();
  }

  updateActiveUsersChart(): void {
    if (!this.activeUsersChart) return;

    const activeCount = this.filteredUsers.filter(user => user.status === 'active').length;
    const inactiveCount = this.filteredUsers.length - activeCount;

    this.activeUsersChart.data.datasets[0].data = [activeCount, inactiveCount];
    this.activeUsersChart.update();
  }
}
