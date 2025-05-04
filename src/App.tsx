import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ParallaxProvider } from 'react-scroll-parallax';
import { LanguageProvider } from './lib/contexts/LanguageContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Projects } from './components/Projects';
import { Universities } from './components/Universities';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { Layout } from './components/shared/Layout';
import { AdminDashboard } from './components/admin/Dashboard';
import { AdminUsers } from './components/admin/Users';
import { AdminProjects } from './components/admin/Projects';
import { AdminSubmissions } from './components/admin/Submissions';
import { AdminSettings } from './components/admin/Settings';
import { SubmissionDetail } from './components/admin/SubmissionDetail';
import { UserDashboard } from './components/user/Dashboard';
import { UserApplications } from './components/user/Applications';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ConsentPage } from './components/auth/ConsentPage';
import { Profile } from './components/shared/Profile';
import { AllProjects } from './components/projects/AllProjects';
import { ProjectDetail } from './components/projects/ProjectDetail';
import { About } from './components/About';
import { UnderConstruction } from './components/UnderConstruction';
import { useAuthStore } from './lib/store';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-violet"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function App() {
  const { setLoading } = useAuthStore();

  useEffect(() => {
    return () => {
      setLoading(true);
    };
  }, [setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <ParallaxProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route
                path="/"
                element={
                  <div className="flex flex-col min-h-screen font-ibm bg-brand-cream">
                    <Header />
                    <Hero />
                    <Projects />
                    <Universities />
                    <CTA />
                    <Footer />
                  </div>
                }
              />

              <Route path="/about" element={<About />} />
              <Route path="/schedule" element={<UnderConstruction />} />
              <Route path="/gallery" element={<UnderConstruction />} />
              <Route path="/consent" element={<ConsentPage />} />

              {/* Projects routes */}
              <Route
                path="/projects"
                element={
                  <div className="flex flex-col min-h-screen font-ibm">
                    <Header />
                    <AllProjects />
                    <Footer />
                  </div>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <div className="flex flex-col min-h-screen font-ibm">
                    <Header />
                    <ProjectDetail />
                    <Footer />
                  </div>
                }
              />

              {/* Auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* User routes */}
              <Route
                path="/user"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<UserDashboard />} />
                <Route path="applications" element={<UserApplications />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="submissions" element={<AdminSubmissions />} />
                <Route path="submissions/:id" element={<SubmissionDetail />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </LanguageProvider>
      </ParallaxProvider>
    </QueryClientProvider>
  );
}

export default App;