'use client';

import React, { useState } from 'react';
import { Mail, Lock, University, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState('credentials'); // 'credentials' or 'magic'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    studentId: '',
    password: '',
    college: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const colleges = [
    'Select your college',
    'MIT',
    'Stanford University', 
    'Harvard University',
    'UC Berkeley',
    'Carnegie Mellon University',
    'Georgia Tech',
    'Other'
  ];

  // Demo credentials for testing
  const demoCredentials = [
    {
      email: 'john.doe@mit.edu',
      studentId: 'MIT123456',
      password: 'demo123',
      college: 'MIT'
    },
    {
      email: 'jane.smith@stanford.edu',
      studentId: 'STAN789012',
      password: 'demo456',
      college: 'Stanford University'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCredentialsLogin = async () => {
    setIsLoading(true);
    
    // Debug: Log the form data
    console.log('Form data:', formData);
    console.log('Demo credentials:', demoCredentials);
    
    // Check if all required fields are filled
    if (!formData.email || !formData.studentId || !formData.password || !formData.college || formData.college === 'Select your college') {
      alert('Please fill in all fields including college selection.');
      setIsLoading(false);
      return;
    }
    
    // Check demo credentials with more flexible matching
    const validDemo = demoCredentials.find(
      cred => 
        cred.email.toLowerCase() === formData.email.toLowerCase() && 
        cred.studentId === formData.studentId && 
        cred.password === formData.password &&
        cred.college === formData.college
    );

    console.log('Valid demo found:', validDemo);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (validDemo) {
      // Store user data in localStorage (in real app, use proper auth tokens)
      localStorage.setItem('campusUser', JSON.stringify({
        email: validDemo.email,
        studentId: validDemo.studentId,
        college: validDemo.college,
        loginTime: new Date().toISOString()
      }));
      
      // Store user name and department for the main app
      localStorage.setItem('campus_user_name', validDemo.email.split('@')[0].replace('.', ' '));
      localStorage.setItem('campus_user_department', validDemo.college);
      
      console.log('Login successful:', validDemo);
      // Redirect to the main dashboard
      router.push('/');
    } else {
      alert('Invalid credentials. Please check:\n\n1. Email: john.doe@mit.edu or jane.smith@stanford.edu\n2. Student ID: MIT123456 or STAN789012\n3. Password: demo123 or demo456\n4. College: MIT or Stanford University');
    }
    
    setIsLoading(false);
  };

  const handleMagicLinkSend = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setOtpSent(true);
    setIsLoading(false);
  };

  const handleOtpVerify = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Demo: accept any 6-digit code
    if (otp.length === 6) {
      localStorage.setItem('campusUser', JSON.stringify({
        email: formData.email,
        college: formData.college,
        loginMethod: 'magic-link',
        loginTime: new Date().toISOString()
      }));
      
      // Store user name and department for the main app
      localStorage.setItem('campus_user_name', formData.email.split('@')[0].replace('.', ' '));
      localStorage.setItem('campus_user_department', formData.college);
      
      console.log('OTP verified:', otp);
      // Redirect to the main dashboard
      router.push('/');
    } else {
      alert('Invalid OTP. Please enter a 6-digit code.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <University className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Copilot</h1>
          <p className="text-gray-600">Your AI College Assistant</p>
        </div>

        {/* Demo Credentials Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Demo Credentials:</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <div><strong>MIT Student:</strong></div>
            <div>Email: john.doe@mit.edu</div>
            <div>ID: MIT123456 | Password: demo123</div>
            <div className="mt-2"><strong>Stanford Student:</strong></div>
            <div>Email: jane.smith@stanford.edu</div>
            <div>ID: STAN789012 | Password: demo456</div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                setFormData({
                  email: 'john.doe@mit.edu',
                  studentId: 'MIT123456',
                  password: 'demo123',
                  college: 'MIT'
                });
              }}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Quick Test MIT
            </button>
            <button
              onClick={() => {
                setFormData({
                  email: 'jane.smith@stanford.edu',
                  studentId: 'STAN789012',
                  password: 'demo456',
                  college: 'Stanford University'
                });
              }}
              className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors"
            >
              Quick Test Stanford
            </button>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          {/* Tab Switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => {
                setLoginMethod('credentials');
                setOtpSent(false);
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'credentials'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Student Login
            </button>
            <button
              onClick={() => {
                setLoginMethod('magic');
                setOtpSent(false);
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'magic'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Credentials Login Form */}
          {loginMethod === 'credentials' && (
            <div className="space-y-4">
              {/* College Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  College/University
                </label>
                <select
                  name="college"
                  value={formData.college}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {colleges.map((college, index) => (
                    <option key={index} value={college} disabled={index === 0}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  College Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@college.edu"
                    required
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Student ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student ID
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  placeholder="STU123456"
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleCredentialsLogin}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Magic Link/OTP Form */}
          {loginMethod === 'magic' && (
            <div className="space-y-4">
              {!otpSent ? (
                <div className="space-y-4">
                  {/* College Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      College/University
                    </label>
                    <select
                      name="college"
                      value={formData.college}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      {colleges.map((college, index) => (
                        <option key={index} value={college} disabled={index === 0}>
                          {college}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      College Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john.doe@college.edu"
                        required
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleMagicLinkSend}
                    disabled={isLoading}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        <span>Send Magic Link</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Mail className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
                    <p className="text-sm text-gray-600">
                      We've sent a 6-digit code to<br />
                      <span className="font-medium">{formData.email}</span>
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      Demo: Enter any 6-digit code (e.g., 123456)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter 6-digit code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      required
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center text-lg font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleOtpVerify}
                    disabled={isLoading || otp.length !== 6}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
                  >
                    ← Back to email entry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Need help? Contact your{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                campus IT support
              </a>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By signing in, you agree to sync your college calendar and preferences
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;