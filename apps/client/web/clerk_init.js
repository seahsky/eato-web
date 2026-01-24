// Clerk.js initialization and helper functions for Flutter web interop

// Store for auth state change callbacks
window._clerkAuthCallbacks = [];

// Wait for Clerk to be fully loaded and initialized
window.waitForClerk = function() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Clerk && window.Clerk.loaded) {
      resolve(window.Clerk);
      return;
    }

    // If Clerk object exists but not loaded, wait for it
    if (window.Clerk) {
      window.Clerk.load()
        .then(() => resolve(window.Clerk))
        .catch(reject);
      return;
    }

    // Wait for the script to load
    const timeout = setTimeout(() => {
      reject(new Error('Clerk failed to load within timeout'));
    }, 10000);

    window.addEventListener('clerk-loaded', function onClerkLoaded() {
      window.removeEventListener('clerk-loaded', onClerkLoaded);
      clearTimeout(timeout);

      if (window.Clerk) {
        window.Clerk.load()
          .then(() => resolve(window.Clerk))
          .catch(reject);
      } else {
        reject(new Error('Clerk object not found after load event'));
      }
    });
  });
};

// Initialize Clerk and set up auth state listener
window.initializeClerk = async function() {
  try {
    const clerk = await window.waitForClerk();

    // Set up auth state change listener
    clerk.addListener((event) => {
      const isSignedIn = !!clerk.session;
      window._clerkAuthCallbacks.forEach(callback => {
        try {
          callback(isSignedIn);
        } catch (e) {
          console.error('[Clerk] Auth callback error:', e);
        }
      });
    });

    console.log('[Clerk] Initialized successfully');
    return true;
  } catch (e) {
    console.error('[Clerk] Initialization failed:', e);
    return false;
  }
};

// Check if user is signed in
window.clerkIsSignedIn = function() {
  if (!window.Clerk || !window.Clerk.loaded) return false;
  return !!window.Clerk.session;
};

// Get the current session token
window.clerkGetToken = async function() {
  if (!window.Clerk || !window.Clerk.loaded || !window.Clerk.session) {
    return null;
  }

  try {
    const token = await window.Clerk.session.getToken();
    return token;
  } catch (e) {
    console.error('[Clerk] Failed to get token:', e);
    return null;
  }
};

// Get user information
window.clerkGetUser = function() {
  if (!window.Clerk || !window.Clerk.loaded || !window.Clerk.user) {
    return null;
  }

  const user = window.Clerk.user;
  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl
  };
};

// Sign out
window.clerkSignOut = async function() {
  if (!window.Clerk || !window.Clerk.loaded) {
    return false;
  }

  try {
    await window.Clerk.signOut();
    return true;
  } catch (e) {
    console.error('[Clerk] Sign out failed:', e);
    return false;
  }
};

// Open sign in modal
window.clerkOpenSignIn = function(redirectUrl) {
  if (!window.Clerk || !window.Clerk.loaded) {
    console.error('[Clerk] Not loaded, cannot open sign in');
    return;
  }

  window.Clerk.openSignIn({
    redirectUrl: redirectUrl || window.location.href
  });
};

// Open sign up modal
window.clerkOpenSignUp = function(redirectUrl) {
  if (!window.Clerk || !window.Clerk.loaded) {
    console.error('[Clerk] Not loaded, cannot open sign up');
    return;
  }

  window.Clerk.openSignUp({
    redirectUrl: redirectUrl || window.location.href
  });
};

// Add auth state change callback
window.clerkAddAuthCallback = function(callback) {
  window._clerkAuthCallbacks.push(callback);
  return window._clerkAuthCallbacks.length - 1;
};

// Remove auth state change callback
window.clerkRemoveAuthCallback = function(index) {
  if (index >= 0 && index < window._clerkAuthCallbacks.length) {
    window._clerkAuthCallbacks.splice(index, 1);
  }
};

// Check if Clerk is loaded and ready
window.clerkIsReady = function() {
  return window.Clerk && window.Clerk.loaded;
};
