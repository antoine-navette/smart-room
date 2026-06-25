import { BrowserRouter, Routes, Route } from "react-router-dom"
import Layout from "./components/layout/Layout"
import Home from "./pages/Home"
import RoomDetails from "./pages/RoomDetails"
import Dashboard from "./pages/Dashboard"
import Admin from "./pages/Admin"
import Login from "./pages/Login"
import Register from "./pages/Register"
import { ToastProvider } from "./components/ui/ToastProvider"
import { AuthProvider } from "./auth/AuthProvider"
import ProtectedRoute from "./auth/ProtectedRoute"

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="room/:id" element={<RoomDetails />} />

            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
            </Route>

            <Route element={<ProtectedRoute requireAdmin />}>
              <Route path="admin" element={<Admin />} />
            </Route>
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App