import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  LogOut, 
  User, 
  Mail, 
  Building, 
  Shield, 
  Calendar, 
  Globe, 
  Settings,
  Lock,
  Eye,
  EyeOff,
  QrCode,
  Copy,
  Download
} from 'lucide-react';
import { apiService } from '../services/api';
import NotificationToast from './NotificationToast';
import { useNotification } from '../hooks/useNotification';

const Dashboard: React.FC = () => {
  const { user, token, logout, updateProfile, changePassword } = useAuth();
  const { notification, showError, showSuccess, showInfo, hideNotification } = useNotification();
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    company: user?.company || '',
  });

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // 2FA state
  const [is2FASetup, setIs2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        showSuccess('Profile Updated', 'Your profile has been updated successfully.');
        setIsEditingProfile(false);
      } else {
        showError('Update Failed', result.message);
      }
    } catch (error) {
      showError('Update Failed', 'An unexpected error occurred.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('Password Mismatch', 'New passwords do not match.');
      return;
    }

    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      if (result.success) {
        showSuccess('Password Changed', 'Your password has been changed successfully.');
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showError('Password Change Failed', result.message);
      }
    } catch (error) {
      showError('Password Change Failed', 'An unexpected error occurred.');
    }
  };

  const handleSetup2FA = async () => {
    if (!token) return;
    
    try {
      const response = await apiService.setup2FA(token);
      if (response.success && response.data) {
        setQrCode(response.data.qrCode);
        setManualKey(response.data.manualEntryKey);
        setIs2FASetup(true);
        showInfo('2FA Setup', 'Scan the QR code with your authenticator app.');
      } else {
        showError('2FA Setup Failed', response.message);
      }
    } catch (error) {
      showError('2FA Setup Failed', 'An unexpected error occurred.');
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    try {
      const response = await apiService.verify2FA({ token: twoFactorToken }, token);
      if (response.success && response.data) {
        setBackupCodes(response.data.backupCodes);
        setShowBackupCodes(true);
        setIs2FASetup(false);
        showSuccess('2FA Enabled', '2FA has been enabled successfully. Save your backup codes!');
        // Refresh user data
        window.location.reload();
      } else {
        showError('2FA Verification Failed', response.message);
      }
    } catch (error) {
      showError('2FA Verification Failed', 'An unexpected error occurred.');
    }
  };

  const handleDisable2FA = async () => {
    if (!token) return;
    
    const password = prompt('Enter your password to disable 2FA:');
    if (!password) return;
    
    try {
      const response = await apiService.disable2FA({ password }, token);
      if (response.success) {
        showSuccess('2FA Disabled', '2FA has been disabled successfully.');
        // Refresh user data
        window.location.reload();
      } else {
        showError('2FA Disable Failed', response.message);
      }
    } catch (error) {
      showError('2FA Disable Failed', 'An unexpected error occurred.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showInfo('Copied', 'Copied to clipboard!');
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <NotificationToast
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <img
                  src="https://res.cloudinary.com/drnak5yb2/image/upload/v1756278804/light_mode_logo_saher_btbdos.svg"
                  alt="Saher Flow Solutions"
                  className="h-10"
                />
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user.firstName}!
            </h2>
            <p className="text-gray-600">
              Access your Saher Flow Solutions professional monitoring dashboard.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* User Profile Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="mr-2" size={20} />
                  Profile Information
                </h3>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-blue-600 hover:text-blue-500 flex items-center gap-1"
                >
                  <Settings size={16} />
                  {isEditingProfile ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              {isEditingProfile ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={profileData.company}
                      onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-yellow-500 hover:bg-yellow-600 text-navy-900 px-4 py-2 rounded-lg font-medium"
                  >
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="text-gray-400" size={16} />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="text-gray-400" size={16} />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{user.email}</p>
                      {user.isEmailVerified ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                          Pending Verification
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Building className="text-gray-400" size={16} />
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="font-medium">{user.company}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Shield className="text-gray-400" size={16} />
                    <div>
                      <p className="text-sm text-gray-500">Role</p>
                      <p className="font-medium capitalize">{user.role}</p>
                    </div>
                  </div>
                  
                  {user.lastLogin && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="text-gray-400" size={16} />
                      <div>
                        <p className="text-sm text-gray-500">Last Login</p>
                        <p className="font-medium">
                          {new Date(user.lastLogin).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {user.lastLoginIP && (
                    <div className="flex items-center space-x-3">
                      <Globe className="text-gray-400" size={16} />
                      <div>
                        <p className="text-sm text-gray-500">Last Login IP</p>
                        <p className="font-medium">{user.lastLoginIP}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Security Settings Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="mr-2" size={20} />
                Security Settings
              </h3>
              
              {/* Password Change Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Password</h4>
                  <button
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    className="text-blue-600 hover:text-blue-500 flex items-center gap-1"
                  >
                    <Lock size={16} />
                    Change Password
                  </button>
                </div>
                
                {isChangingPassword && (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-yellow-500 hover:bg-yellow-600 text-navy-900 px-4 py-2 rounded-lg font-medium"
                      >
                        Change Password
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsChangingPassword(false)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 2FA Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-500">
                      {user.twoFactorEnabled ? 'Enabled' : 'Add an extra layer of security'}
                    </p>
                  </div>
                  {user.twoFactorEnabled ? (
                    <button
                      onClick={handleDisable2FA}
                      className="text-red-600 hover:text-red-500 flex items-center gap-1"
                    >
                      <Shield size={16} />
                      Disable
                    </button>
                  ) : (
                    <button
                      onClick={handleSetup2FA}
                      className="text-green-600 hover:text-green-500 flex items-center gap-1"
                    >
                      <Shield size={16} />
                      Enable
                    </button>
                  )}
                </div>

                {/* 2FA Setup Modal */}
                {is2FASetup && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-3">Setup Two-Factor Authentication</h5>
                    
                    <div className="space-y-4">
                      <div className="text-center">
                        <img src={qrCode} alt="QR Code" className="mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Scan this QR code with your authenticator app
                        </p>
                        <div className="flex items-center gap-2 justify-center">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{manualKey}</code>
                          <button
                            onClick={() => copyToClipboard(manualKey)}
                            className="text-blue-600 hover:text-blue-500"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <form onSubmit={handleVerify2FA}>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Enter 6-digit code from your app
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={twoFactorToken}
                          onChange={(e) => setTwoFactorToken(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400 text-center text-lg tracking-widest"
                          placeholder="000000"
                          required
                        />
                        <div className="flex gap-2 mt-3">
                          <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                          >
                            Verify & Enable
                          </button>
                          <button
                            type="button"
                            onClick={() => setIs2FASetup(false)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Backup Codes Modal */}
                {showBackupCodes && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-green-900">Backup Codes</h5>
                      <button
                        onClick={downloadBackupCodes}
                        className="text-green-600 hover:text-green-500 flex items-center gap-1"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                    <p className="text-sm text-green-700 mb-3">
                      Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <code className="bg-white px-2 py-1 rounded text-sm flex-1">{code}</code>
                          <button
                            onClick={() => copyToClipboard(code)}
                            className="text-green-600 hover:text-green-500"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowBackupCodes(false)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      I've Saved My Codes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Verification Notice */}
          {!user.isEmailVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
              <div className="flex items-center">
                <Mail className="text-yellow-600 mr-3" size={20} />
                <div>
                  <h4 className="text-yellow-800 font-medium">Email Verification Required</h4>
                  <p className="text-yellow-700 text-sm mt-1">
                    Please check your email and click the verification link to access all features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Content Placeholder */}
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Monitoring Dashboard
            </h3>
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Building size={48} className="mx-auto" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Dashboard Coming Soon
              </h4>
              <p className="text-gray-600">
                Your flow measurement monitoring tools will be available here.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;