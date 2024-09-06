import React, { useState } from 'react';

const LoginRegister = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const toggleForm = () => setIsRegister(!isRegister);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="container">
      <div className={`form-container ${isRegister ? 'register-mode' : ''}`}>
        <div className="form-box">
          <h2>{isRegister ? 'Register' : 'Login'}</h2>

          <form>
            {/* Username Field */}
            <div className="input-box">
              <input type="text" required />
              <label>Username</label>
            </div>

            {/* Email Field (only shown if registering) */}
            {isRegister && (
              <div className="input-box">
                <input type="email" required />
                <label>Email</label>
              </div>
            )}

            {/* Phone Number Field (only shown if registering) */}
            {isRegister && (
              <div className="input-box">
                <input type="tel" required />
                <label>Phone Number</label>
              </div>
            )}

            {/* Password Field */}
            <div className="input-box">
              <input
                type={showPassword ? 'text' : 'password'}
                required
              />
              <label>Password</label>
              <span
                className={`toggle-password ${showPassword ? 'show' : ''}`}
                onClick={togglePasswordVisibility}
              >
                {showPassword ? 'Hide' : 'Show'}
              </span>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn">
              {isRegister ? 'Register' : 'Login'}
            </button>

            {/* Toggle Text */}
            <p className="toggle-text">
              {isRegister ? 'Already have an account?' : 'Don’t have an account?'}{' '}
              <span className="toggle-link" onClick={toggleForm}>
                {isRegister ? 'Login' : 'Register'} here
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
