import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
import { ThemeProvider } from './context/ThemeContext';
import BrandLoader from './components/BrandLoader';
import MainLayout from './layouts/MainLayout';
import DashLayout from './layouts/DashLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import SearchPage from './pages/SearchPage';
import PostDetailsPage from './pages/PostDetailsPage';
import CategoryPage from './pages/CategoryPage';
import HashtagPage from './pages/HashtagPage';
import ProfilePage from './pages/ProfilePage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import PostEditorPage from './pages/PostEditorPage';
import BookmarksPage from './pages/BookmarksPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminPostsPage from './pages/admin/AdminPostsPage';
import AdminCommentsPage from './pages/admin/AdminCommentsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminHashtagsPage from './pages/admin/AdminHashtagsPage';
import AdminModerationPage from './pages/admin/AdminModerationPage';
import EmailComposePage from './pages/admin/EmailComposePage';
import EditorDashboardPage from './pages/editor/EditorDashboardPage';

function Boot() {
  const { loading } = useAuth();
  if (loading) return <BrandLoader />;
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/posts/:id" element={<PostDetailsPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/hashtag/:name" element={<HashtagPage />} />
        <Route path="/u/:username" element={<ProfilePage />} />
      </Route>

      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

      <Route element={<ProtectedRoute requireVerified requireOnboardingDone />}>
        <Route element={<MainLayout />}>
          <Route path="/write" element={<PostEditorPage mode="create" />} />
          <Route path="/posts/:id/edit" element={<PostEditorPage mode="edit" />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/me" element={<MeRedirect />} />
        </Route>
      </Route>

      <Route element={<RoleRoute roles={['ADMIN']} />}>
        <Route element={<DashLayout variant="admin" />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/posts" element={<AdminPostsPage />} />
          <Route path="/admin/comments" element={<AdminCommentsPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/hashtags" element={<AdminHashtagsPage />} />
          <Route path="/admin/moderation" element={<AdminModerationPage />} />
          <Route path="/admin/emails" element={<EmailComposePage />} />
        </Route>
      </Route>

      <Route element={<RoleRoute roles={['ADMIN', 'CHIEF_EDITOR']} />}>
        <Route element={<DashLayout variant="editor" />}>
          <Route path="/editor" element={<EditorDashboardPage />} />
          <Route path="/editor/posts" element={<AdminPostsPage />} />
          <Route path="/editor/featured" element={<AdminPostsPage featuredOnly />} />
          <Route path="/editor/reports" element={<AdminReportsPage />} />
          <Route path="/editor/categories" element={<AdminCategoriesPage />} />
          <Route path="/editor/emails" element={<EmailComposePage />} />
        </Route>
      </Route>

      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/" replace />} />
      <Route path="/reset-password" element={<Navigate to="/" replace />} />
      <Route path="/verify-email" element={<Navigate to="/" replace />} />
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function MeRedirect() {
  const { user } = useAuth();
  return <Navigate to={`/u/${user.username}`} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AuthModalProvider>
            <Boot />
          </AuthModalProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
