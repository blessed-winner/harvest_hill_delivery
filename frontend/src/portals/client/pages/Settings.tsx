export default function Settings() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#144227] mb-2">Settings</h1>
        <p className="text-gray-600 mb-8">Manage your account and preferences</p>
        
        {/* Settings sections placeholder */}
        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Settings</h2>
            <p className="text-gray-500">Update your personal information and contact details</p>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notifications</h2>
            <p className="text-gray-500">Manage your email and push notification preferences</p>
          </div>

          {/* Delivery Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Preferences</h2>
            <p className="text-gray-500">Set your default delivery address and time preferences</p>
          </div>

          {/* Account Security */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Security</h2>
            <p className="text-gray-500">Change your password and manage security settings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
