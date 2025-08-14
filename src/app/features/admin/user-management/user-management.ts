import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminSidebar } from '../components/admin-sidebar/admin-sidebar';
import { 
  AdminUserService, 
  UserManagementResponse, 
  UserSummaryDto, 
  UserDetailDto,
  UserSearchRequest,
  UserRole,
  VerificationStatus,
  UserStatisticsDto,
  CreateUserRequest,
  UpdateUserRequest
} from '../../../shared/services/admin-user.service';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    FormsModule,
    AdminSidebar
  ],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.scss']
})
export class UserManagement implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  
  // ✅ Current Date and Time
  private readonly CURRENT_UTC_TIME = new Date('2025-08-13T22:57:53Z');
  
  // Component state
  isLoading = true;
  isSearching = false;
  isSidebarCollapsed = false;
  activeMenuItem = 'users';
  currentUser = '';
  
  // User data
  users: UserSummaryDto[] = [];
  userStatistics: UserStatisticsDto | null = null;
  
  // Search and filtering
  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';
  
  // Pagination
  currentPage = 0; // Backend uses 0-based pagination
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Modal states
  showAddUserModal = false;
  showEditUserModal = false;
  isAddingUser = false;
  isEditingUser = false;
  
  // Modal data
  selectedUser: UserSummaryDto | null = null;
  newUser: CreateUserRequest = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleNames: []
  };
  selectedNewUserRole = '';
  editUserData: UpdateUserRequest = {};
  
  // UI data
  roles = [
    { value: '', label: 'ADMIN.USER_MANAGEMENT.ALL_ROLES' },
    { value: UserRole.CLIENT, label: 'ADMIN.USER_MANAGEMENT.CLIENT' },
    { value: UserRole.FREELANCER, label: 'ADMIN.USER_MANAGEMENT.FREELANCER' },
    { value: UserRole.SERVICE_COMPANY, label: 'ADMIN.USER_MANAGEMENT.SERVICE_COMPANY' },
    { value: UserRole.ADMIN, label: 'ADMIN.USER_MANAGEMENT.ADMIN' }
  ];

  statuses = [
    { value: '', label: 'ADMIN.USER_MANAGEMENT.ALL_STATUSES' },
    { value: 'true', label: 'ADMIN.USER_MANAGEMENT.VERIFIED' },
    { value: 'false', label: 'ADMIN.USER_MANAGEMENT.UNVERIFIED' },
    { value: VerificationStatus.PENDING, label: 'ADMIN.USER_MANAGEMENT.PENDING_VERIFICATION' },
    { value: VerificationStatus.VERIFIED, label: 'ADMIN.USER_MANAGEMENT.VERIFIED_STATUS' },
    { value: VerificationStatus.REJECTED, label: 'ADMIN.USER_MANAGEMENT.REJECTED' }
  ];
Math: any;

  constructor(
    private router: Router,
    public adminUserService: AdminUserService, // ✅ Make public for template access
    private authService: AuthService
  ) {
    console.log('🚀 UserManagement initialized for:', this.currentUser);
    console.log('⏰ Current UTC Time:', this.CURRENT_UTC_TIME.toISOString());
  }

  async ngOnInit(): Promise<void> {
    console.log('📋 UserManagement: Initializing for', this.currentUser);
    
    // Check admin permissions
    if (!this.adminUserService.isAdminUser()) {
      console.error('❌ Access denied: Admin permissions required');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Setup search debouncing
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 0;
      this.loadUsers();
    });

    try {
      await this.loadInitialData();
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Add this method to your UserManagement component
clearFilters(): void {
  console.log('🧹 Clearing all filters');
  this.searchTerm = '';
  this.selectedRole = '';
  this.selectedStatus = '';
  this.currentPage = 0;
  this.loadUsers();
}

// Update the getCurrentTimeInfo() method


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============= DATA LOADING METHODS =============

  private async loadInitialData(): Promise<void> {
    console.log('📊 Loading initial user management data for', this.currentUser);
    
    try {
      // Load users and statistics in parallel
      const promises = [
        this.loadUsers(),
        this.loadUserStatistics()
      ];

      await Promise.all(promises);
      console.log('✅ Initial data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      this.loadMockData(); // Fallback to mock data
    }
  }

  private async loadUsers(): Promise<void> {
    try {
      this.isLoading = true;
      console.log('📋 Loading users with criteria:', {
        searchTerm: this.searchTerm,
        role: this.selectedRole,
        status: this.selectedStatus,
        page: this.currentPage,
        size: this.itemsPerPage
      });

      const searchRequest: UserSearchRequest = {
        searchTerm: this.searchTerm || undefined,
        role: this.selectedRole || undefined,
        verificationStatus: this.isVerificationStatus(this.selectedStatus) ? this.selectedStatus : undefined,
        verified: this.isBooleanStatus(this.selectedStatus) ? this.selectedStatus === 'true' : undefined,
        page: this.currentPage,
        size: this.itemsPerPage,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      };

      this.adminUserService.getAllUsers(searchRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: UserManagementResponse) => {
            console.log('✅ Users loaded successfully:', response);
            
            this.users = response.users;
            this.totalItems = response.totalElements;
            this.totalPages = response.totalPages;
            this.currentPage = response.currentPage;
            this.isLoading = false;
            
            console.log(`📋 Loaded ${this.users.length} users for ${this.currentUser}`);
          },
          error: (error) => {
            console.error('❌ Error loading users:', error);
            this.isLoading = false;
            this.loadMockData();
          }
        });

    } catch (error) {
      console.error('❌ Error in loadUsers:', error);
      this.isLoading = false;
      this.loadMockData();
    }
  }

  private loadUserStatistics(): void {
    console.log('📊 Loading user statistics for', this.currentUser);
    
    this.adminUserService.getUserStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: UserStatisticsDto) => {
          this.userStatistics = stats;
          console.log('✅ User statistics loaded:', stats);
        },
        error: (error) => {
          console.error('❌ Error loading user statistics:', error);
          // Create mock statistics
          this.userStatistics = {
            totalUsers: this.users.length,
            verifiedUsers: this.users.filter(u => u.verified).length,
            pendingVerification: this.users.filter(u => u.verificationStatus === VerificationStatus.PENDING).length,
            activeThisMonth: Math.floor(this.users.length * 0.3),
            freelancers: this.users.filter(u => u.roles.includes(UserRole.FREELANCER)).length,
            clients: this.users.filter(u => u.roles.includes(UserRole.CLIENT)).length,
            serviceCompanies: this.users.filter(u => u.roles.includes(UserRole.SERVICE_COMPANY)).length,
            verificationRate: this.users.length > 0 ? (this.users.filter(u => u.verified).length / this.users.length) * 100 : 0
          };
        }
      });
  }

  private loadMockData(): void {
    console.log('📝 Loading mock user data for development');
    
    this.users = [
      {
        id: 1,
        username: 'john_client',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Smith',
        profilePictureUrl: '',
        verified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        roles: [UserRole.CLIENT],
        lastActive: '2025-08-13 20:30:45',
        createdAt: '2024-01-15 10:30:00'
      },
      {
        id: 2,
        username: 'sarah_freelancer',
        email: 'sarah@example.com',
        firstName: 'Sarah',
        lastName: 'Wilson',
        profilePictureUrl: '',
        verified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        roles: [UserRole.FREELANCER],
        lastActive: '2025-08-13 22:45:12',
        createdAt: '2024-02-20 09:15:00'
      },
      {
        id: 3,
        username: 'techcorp',
        email: 'contact@techcorp.com',
        firstName: 'TechCorp',
        lastName: 'Inc.',
        profilePictureUrl: '',
        verified: false,
        verificationStatus: VerificationStatus.PENDING,
        roles: [UserRole.SERVICE_COMPANY],
        lastActive: '2025-08-12 14:20:33',
        createdAt: '2024-03-10 16:45:00'
      },
      {
        id: 4,
        username: this.currentUser,
        email: 'admin@proconnect.com',
        firstName: 'Admin',
        lastName: 'User',
        profilePictureUrl: '',
        verified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        roles: [UserRole.ADMIN],
        lastActive: '2025-08-13 22:57:53',
        createdAt: '2024-01-01 08:00:00'
      }
    ];
    
    this.totalItems = this.users.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    console.log('✅ Mock data loaded:', this.users.length, 'users');
  }

  // ============= SEARCH AND FILTER METHODS =============

  onSearch(): void {
    console.log('🔍 Search triggered for', this.currentUser, ':', this.searchTerm);
    this.searchSubject$.next(this.searchTerm);
  }

  onRoleFilter(): void {
    console.log('👥 Role filter changed for', this.currentUser, ':', this.selectedRole);
    this.currentPage = 0;
    this.loadUsers();
  }

  onStatusFilter(): void {
    console.log('✅ Status filter changed for', this.currentUser, ':', this.selectedStatus);
    this.currentPage = 0;
    this.loadUsers();
  }

  // ============= PAGINATION METHODS =============

  onPageChange(page: number): void {
    console.log('📄 Page change for', this.currentUser, ':', page);
    
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  get paginatedUsers(): UserSummaryDto[] {
    return this.users; // Backend handles pagination
  }

  getEndItem(): number {
    return Math.min((this.currentPage + 1) * this.itemsPerPage, this.totalItems);
  }

  // ============= USER ACTION METHODS =============

  viewUser(user: UserSummaryDto): void {
    console.log('👀 Viewing user details for', this.currentUser, ':', user.username);
    
    this.adminUserService.getUserById(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userDetail: UserDetailDto) => {
          console.log('✅ User details loaded:', userDetail);
          // TODO: Open user details modal or navigate to user detail page
          alert(`User Details:\n${JSON.stringify(userDetail, null, 2)}`);
        },
        error: (error) => {
          console.error('❌ Error loading user details:', error);
          alert('Error loading user details: ' + error);
        }
      });
  }

  editUser(user: UserSummaryDto): void {
    console.log('✏️ Editing user for', this.currentUser, ':', user.username);
    
    // TODO: Open edit user modal or navigate to edit page
    const updateRequest: UpdateUserRequest = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      verified: user.verified,
      verificationStatus: user.verificationStatus
    };
    
    console.log('Edit request:', updateRequest);
    alert(`Edit User: ${this.adminUserService.getUserFullName(user)}\n(Implementation pending)`);
  }

  markUserAsVerified(user: UserSummaryDto): void {
    console.log('✅ Verifying user for', this.currentUser, ':', user.username);
    
    if (user.verified) {
      alert('User is already verified');
      return;
    }

    if (confirm(`Mark ${this.adminUserService.getUserFullName(user)} as verified?`)) {
      this.adminUserService.markUserAsVerified(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (verifiedUser: UserDetailDto) => {
            console.log('✅ User verified successfully:', verifiedUser);
            this.loadUsers(); // Refresh user list
            alert('User verified successfully!');
          },
          error: (error) => {
            console.error('❌ Error verifying user:', error);
            alert('Error verifying user: ' + error);
          }
        });
    }
  }

  suspendUser(user: UserSummaryDto): void {
    console.log('⏸️ Suspending user for', this.currentUser, ':', user.username);
    
    const fullName = this.adminUserService.getUserFullName(user);
    if (confirm(`Are you sure you want to suspend ${fullName}?`)) {
      // TODO: Implement user suspension
      alert(`Suspend User: ${fullName}\n(Implementation pending)`);
    }
  }

  activateUser(user: UserSummaryDto): void {
    console.log('▶️ Activating user for', this.currentUser, ':', user.username);
    
    const fullName = this.adminUserService.getUserFullName(user);
    alert(`Activate User: ${fullName}\n(Implementation pending)`);
  }

  deleteUser(user: UserSummaryDto): void {
    console.log('🗑️ Deleting user for', this.currentUser, ':', user.username);
    
    const fullName = this.adminUserService.getUserFullName(user);
    if (confirm(`Are you sure you want to delete ${fullName}? This action cannot be undone.`)) {
      this.adminUserService.deleteUser(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('✅ User deleted successfully:', response);
            this.loadUsers(); // Refresh user list
            alert('User deleted successfully!');
          },
          error: (error) => {
            console.error('❌ Error deleting user:', error);
            alert('Error deleting user: ' + error);
          }
        });
    }
  }

  // ============= SIDEBAR METHODS =============

  onSidebarItemSelected(itemId: string): void {
    console.log('📋 Sidebar item selected for', this.currentUser, ':', itemId);
    this.activeMenuItem = itemId;
  }

  onSidebarToggle(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    console.log('📱 Sidebar toggled for', this.currentUser, ':', this.isSidebarCollapsed ? 'collapsed' : 'expanded');
  }

  // ============= UTILITY METHODS =============

  private isVerificationStatus(status: string): boolean {
    return Object.values(VerificationStatus).includes(status as VerificationStatus);
  }

  private isBooleanStatus(status: string): boolean {
    return status === 'true' || status === 'false';
  }

  getRoleLabel(roles: string[]): string {
    if (!roles || roles.length === 0) return 'No Role';
    
    const displayRoles = this.adminUserService.getRoleDisplayNames(roles);
    return displayRoles.join(', ');
  }

  getFullName(user: UserSummaryDto): string {
    return this.adminUserService.getUserFullName(user);
  }

  getUserStatus(user: UserSummaryDto): string {
    // If explicitly verified is true, show as verified
    if (user.verified === true) {
      return 'Verified';
    }
    
    // For all other cases, use the verification status
    return this.adminUserService.getVerificationStatusDisplay(user.verificationStatus);
  }

  getStatusBadgeClass(user: UserSummaryDto): string {
    // If explicitly verified is true, show green
    if (user.verified === true) {
      return 'bg-green-100 text-green-800';
    }
    
    // For all other cases, use the verification status class
    return this.adminUserService.getVerificationStatusClass(user.verificationStatus);
  }

  getRoleBadgeClass(roles: string[]): string {
    if (!roles || roles.length === 0) return 'bg-gray-100 text-gray-800';
    
    const primaryRole = roles[0];
    switch (primaryRole) {
      case UserRole.CLIENT: 
        return 'bg-blue-100 text-blue-800';
      case UserRole.FREELANCER: 
        return 'bg-purple-100 text-purple-800';
      case UserRole.SERVICE_COMPANY: 
        return 'bg-orange-100 text-orange-800';
      case UserRole.ADMIN: 
        return 'bg-red-100 text-red-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  }

  getLastActiveDisplay(user: UserSummaryDto): string {
    if (!user.lastActive) return 'Never';
    return this.adminUserService.getRelativeTime(user.lastActive);
  }

  getCreatedAtDisplay(user: UserSummaryDto): string {
    return this.adminUserService.formatDate(user.createdAt);
  }

  // ============= TEMPLATE HELPER METHODS =============

  getCurrentTimeInfo(): string {
    const now = this.CURRENT_UTC_TIME;
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
    const dateString = now.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'UTC'
    });
    return `${dateString} at ${timeString} UTC`;
  }

  getStatisticsDisplay(): string {
    if (!this.userStatistics) return 'Loading...';
    
    return `Total: ${this.userStatistics.totalUsers}, ` +
           `Verified: ${this.userStatistics.verifiedUsers}, ` +
           `Pending: ${this.userStatistics.pendingVerification}`;
  }

  // ============= DEBUG METHODS =============

  logServiceStatus(): void {
    this.adminUserService.logServiceStatus();
  }

  refreshData(): void {
    console.log('🔄 Refreshing user management data for', this.currentUser);
    this.isLoading = true;
    this.loadInitialData().finally(() => {
      this.isLoading = false;
    });
  }

  // ============= MODAL METHODS =============

  openAddUserModal(): void {
    this.showAddUserModal = true;
    this.resetNewUserForm();
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.resetNewUserForm();
  }

  resetNewUserForm(): void {
    this.newUser = {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleNames: []
    };
    this.selectedNewUserRole = '';
  }

  async onAddUser(): Promise<void> {
    if (!this.selectedNewUserRole) {
      console.error('❌ Role must be selected');
      alert('Please select a role for the user');
      return;
    }

    this.isAddingUser = true;
    
    try {
      // Set the role in the request
      this.newUser.roleNames = [this.selectedNewUserRole];
      
      const createdUser = await this.adminUserService.createUser(this.newUser).toPromise();
      console.log('✅ User created successfully:', createdUser);
      
      // Refresh the user list
      await this.loadUsers();
      
      // Close modal and show success message
      this.closeAddUserModal();
      alert('User created successfully!');
      
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      alert('Error creating user: ' + (error.error?.message || error.message || 'Unknown error'));
    } finally {
      this.isAddingUser = false;
    }
  }

  openEditUserModal(user: UserSummaryDto): void {
    this.selectedUser = user;
    this.editUserData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      verified: user.verified,
      verificationStatus: user.verificationStatus
    };
    this.showEditUserModal = true;
  }

  closeEditUserModal(): void {
    this.showEditUserModal = false;
    this.selectedUser = null;
    this.editUserData = {};
  }

  async onEditUser(): Promise<void> {
    if (!this.selectedUser) return;

    this.isEditingUser = true;
    
    try {
      const updatedUser = await this.adminUserService.updateUser(this.selectedUser.id, this.editUserData).toPromise();
      console.log('✅ User updated successfully:', updatedUser);
      
      // Refresh the user list
      await this.loadUsers();
      
      // Close modal and show success message
      this.closeEditUserModal();
      alert('User updated successfully!');
      
    } catch (error: any) {
      console.error('❌ Error updating user:', error);
      alert('Error updating user: ' + (error.error?.message || error.message || 'Unknown error'));
    } finally {
      this.isEditingUser = false;
    }
  }
}