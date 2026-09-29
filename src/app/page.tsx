'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product, Order, StockMovement, User, Profile } from '@/lib/types';
import AdminLogin from '@/components/AdminLogin';
import ImageUploader from '@/components/ImageUploader';
import CreateAdminModal from '@/components/CreateAdminModal';
import {
  Shield,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Download,
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
  Database,
  X,
  MessageCircle,
  ShoppingBag,
  Users,
  ExternalLink,
  ChevronDown,
  LogOut,
  UserPlus,
  Key,
  HardDrive,
  Check,
  Clock,
  ShieldCheck,
  Sliders,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';

export default function AdminSuitePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'kardex' | 'profiles' | 'users' | 'storage'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [kardexFilterProduct, setKardexFilterProduct] = useState<string>('all');

  // Modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  // Formulario Perfil
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    description: '',
    canCatalog: true,
    canOrders: true,
    canValidatePayments: false,
    canKardex: false,
    canUsers: false,
    canErpExport: false,
  });

  // Formulario Producto
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Aura Niche',
    concentration: 'Extrait de Parfum (35%)',
    olfactiveFamily: 'Oriental & Oud',
    retailPrice: 420,
    discountPrice: 365 as number | '',
    price: 365,
    stock: 12,
    sku: '',
    image: '/images/perfumes/oud-royal.jpg',
    images: [] as { url: string; localPath?: string; isPrimary: boolean; order: number }[],
    volumeMl: 100,
    description: '',
    notesTop: 'Bergamota, Azafrán, Cardamomo',
    notesHeart: 'Rosa de Damasco, Cedro Atlas, Incienso',
    notesBase: 'Oud Salvaje, Ámbar Gris, Cuero',
    longevity: '14+ Horas (Ultra-fijación)',
    sillage: 'Intenso & Soberano',
    isFeatured: true,
  });

  // Formulario Pedido Manual
  const [manualOrderError, setManualOrderError] = useState<string | null>(null);
  const [manualOrderData, setManualOrderData] = useState({
    productId: '',
    quantity: 1,
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    shippingCity: 'Lima',
    paymentMethod: 'TRANSFERENCIA',
    customerNotes: 'Venta asistida por Administrador (WhatsApp / Teléfono)',
    autoValidatePayment: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Verificar sesión persistente al cargar
  useEffect(() => {
    try {
      const stored = localStorage.getItem('aura_admin_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
      }
    } catch (e) {
      console.error('Error restaurando sesión admin', e);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Cargar datos cuando haya un usuario autenticado
  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, oRes, mRes, uRes, profRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/stock-audits'),
        fetch('/api/users'),
        fetch('/api/profiles'),
      ]);

      const [pData, oData, mData, uData, profData] = await Promise.all([
        pRes.json(),
        oRes.json(),
        mRes.json(),
        uRes.json(),
        profRes.json(),
      ]);

      if (pData.success) setProducts(pData.products);
      if (oData.success) setOrders(oData.orders);
      if (mData.success) setMovements(mData.movements);
      if (uData.success) setUsers(uData.users);
      if (profData.success) setProfiles(profData.profiles);

      if (pData.products && pData.products.length > 0 && !manualOrderData.productId) {
        setManualOrderData((prev) => ({ ...prev, productId: pData.products[0].id }));
      }
    } catch (e) {
      console.error('Error fetching admin data', e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleLogout = () => {
    localStorage.removeItem('aura_admin_session');
    setCurrentUser(null);
  };

  // Permisos efectivos del usuario actual
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';
  const canCatalog = isSuperAdmin || Boolean(currentUser?.profile?.canCatalog);
  const canOrders = isSuperAdmin || Boolean(currentUser?.profile?.canOrders);
  const canValidatePayments = isSuperAdmin || Boolean(currentUser?.profile?.canValidatePayments);
  const canKardex = isSuperAdmin || Boolean(currentUser?.profile?.canKardex);
  const canUsers = isSuperAdmin || Boolean(currentUser?.profile?.canUsers);
  const canErpExport = isSuperAdmin || Boolean(currentUser?.profile?.canErpExport);

  // ==========================================
  // OPERACIONES DE PRODUCTO
  // ==========================================

  const handleOpenNewModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      brand: 'Aura Niche',
      concentration: 'Extrait de Parfum (35%)',
      olfactiveFamily: 'Oriental & Oud',
      retailPrice: 420,
      discountPrice: 365,
      price: 365,
      stock: 10,
      sku: `AUR-${Math.floor(100 + Math.random() * 900)}`,
      image: '/images/perfumes/oud-royal.jpg',
      images: [{ url: '/images/perfumes/oud-royal.jpg', isPrimary: true, order: 1 }],
      volumeMl: 100,
      description: 'Una creación sublime de alta concentración elaborada con aceites puros.',
      notesTop: 'Azafrán, Cardamomo Verde, Bergamota',
      notesHeart: 'Incienso de Omán, Madera de Rosa',
      notesBase: 'Oud Camboyano, Ámbar Gris',
      longevity: '14+ Horas (Ultra-fijación)',
      sillage: 'Monumental',
      isFeatured: true,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    const existingImages: { url: string; localPath?: string; isPrimary: boolean; order: number }[] =
      prod.images && prod.images.length > 0
        ? prod.images.map((img) => ({
            url: img.url,
            localPath: img.localPath || undefined,
            isPrimary: img.isPrimary,
            order: img.order,
          }))
        : [{ url: prod.image, isPrimary: true, order: 1 }];

    setFormData({
      name: prod.name,
      brand: prod.brand,
      concentration: prod.concentration,
      olfactiveFamily: prod.olfactiveFamily,
      retailPrice: prod.retailPrice || prod.price,
      discountPrice: prod.discountPrice || '',
      price: prod.price,
      stock: prod.stock,
      sku: prod.sku,
      image: prod.image,
      images: existingImages,
      volumeMl: prod.volumeMl,
      description: prod.description,
      notesTop: prod.notesTop,
      notesHeart: prod.notesHeart,
      notesBase: prod.notesBase,
      longevity: prod.longevity,
      sillage: prod.sillage,
      isFeatured: prod.isFeatured,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const primaryImg = formData.images.find((i) => i.isPrimary)?.url || formData.images[0]?.url || formData.image;
      const effectivePrice = formData.discountPrice && Number(formData.discountPrice) > 0
        ? Number(formData.discountPrice)
        : Number(formData.retailPrice);

      const payload = {
        ...formData,
        image: primaryImg,
        retailPrice: Number(formData.retailPrice),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        price: effectivePrice,
      };

      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setIsProductModalOpen(false);
          showToast(`Perfume "${formData.name}" actualizado.`);
          fetchData();
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setIsProductModalOpen(false);
          showToast(`Perfume "${formData.name}" registrado en PostgreSQL.`);
          fetchData();
        }
      }
    } catch (err) {
      console.error('Error al guardar perfume:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Confirma que desea retirar esta fragancia del catálogo?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Perfume retirado del inventario.');
        fetchData();
      }
    } catch (err) {
      console.error('Error al eliminar perfume:', err);
    }
  };

  const handleQuickStockAdjust = async (productId: string, delta: number) => {
    try {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          change: delta,
          reason: delta > 0 ? 'Reabastecimiento rápido desde Suite Admin' : 'Ajuste por merma o muestra',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Stock actualizado (${delta > 0 ? '+' : ''}${delta}) y asentado en Kardex.`);
        fetchData();
      }
    } catch (err) {
      console.error('Error ajustando stock:', err);
    }
  };

  // ==========================================
  // VALIDACIÓN DE PAGO & DESCARGA DE STOCK
  // ==========================================

  const handleValidatePayment = async (orderId: string, orderNumber: string) => {
    if (!canValidatePayments) {
      alert('Acceso restringido: Su perfil no cuenta con permisos para validar pagos y autorizar descarga de stock.');
      return;
    }

    if (!confirm(`¿Confirma la validación del comprobante para el Pedido #${orderNumber}? Al validar, se descontará automáticamente el stock de almacén y se registrará en el Kardex.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}/validate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validatedBy: currentUser?.email || 'superadmin@auraparfums.com' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'No se pudo validar el pago');
        return;
      }

      showToast(`¡Pago del Pedido #${orderNumber} validado con éxito! Stock descargado e ingresado al Kardex.`);
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Error al validar el pago');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PEDIDOS MANUALES
  // ==========================================

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualOrderError(null);

    if (!manualOrderData.customerName || !manualOrderData.customerPhone || !manualOrderData.shippingAddress) {
      setManualOrderError('Nombre, teléfono y dirección son obligatorios.');
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...manualOrderData,
          creatorUser: currentUser?.email,
          items: [{ productId: manualOrderData.productId, quantity: Number(manualOrderData.quantity) }],
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setManualOrderError(data.error || 'Error al registrar pedido.');
        return;
      }

      setIsOrderModalOpen(false);
      showToast(`Pedido asistido #${data.order.orderNumber} registrado.`);
      fetchData();
    } catch (err: any) {
      setManualOrderError(err.message || 'Error al conectar con la base de datos.');
    }
  };

  // ==========================================
  // GESTIÓN DE PERFILES Y PERMISOS (RBAC)
  // ==========================================

  const handleOpenNewProfileModal = () => {
    setEditingProfile(null);
    setProfileFormData({
      name: '',
      description: '',
      canCatalog: true,
      canOrders: true,
      canValidatePayments: false,
      canKardex: false,
      canUsers: false,
      canErpExport: false,
    });
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFormData.name.trim()) return;

    try {
      if (editingProfile) {
        const res = await fetch(`/api/profiles/${editingProfile.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileFormData),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Perfil "${profileFormData.name}" actualizado.`);
          setIsProfileModalOpen(false);
          fetchData();
        }
      } else {
        const res = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileFormData),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Perfil "${profileFormData.name}" creado con éxito.`);
          setIsProfileModalOpen(false);
          fetchData();
        }
      }
    } catch (e: any) {
      alert(e.message || 'Error al guardar perfil.');
    }
  };

  const handleAssignProfileToUser = async (userId: string, newProfileId: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profileId: newProfileId || null }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Perfil asignado correctamente al usuario.');
        fetchData();
      }
    } catch (e: any) {
      alert('Error asignando perfil: ' + e.message);
    }
  };

  // ==========================================
  // EXPORTACIÓN ERP
  // ==========================================

  const handleExportErp = async (orderId: string, orderNumber: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/export-erp`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.erpPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ERP_FACTURACION_${orderNumber}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Ficha contable para Pedido #${orderNumber} exportada.`);
        fetchData();
      }
    } catch (e) {
      console.error('Error exportando ERP', e);
    }
  };

  // Si no está autenticado, mostrar pantalla de login
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fbfbf9] flex items-center justify-center text-[#0f4c3a]">
        <Sparkles className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <AdminLogin onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  // Filtrado de productos para búsqueda
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrado de Kardex
  const filteredMovements = movements.filter((m) => {
    if (kardexFilterProduct === 'all') return true;
    return m.productId === kardexFilterProduct;
  });

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-[#12241c] flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f4c3a] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#14634c] animate-in fade-in slide-in-from-bottom-3 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Professional Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#0f4c3a]/15 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-[#0f4c3a]/20 flex items-center justify-center text-[#0f4c3a] shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-luxury text-xl font-bold text-[#0a261a]">
                  Aura Maison
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-[#0f4c3a] border border-[#0f4c3a]/25">
                  Suite de Administración
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Control Operativo, Validación de Pagos y Kardex Secuencial
              </p>
            </div>
          </div>

          {/* User Session Bar */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#0a261a]">{currentUser.name || currentUser.email}</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {currentUser.role === 'SUPERADMIN' ? '👑 Superadministrador' : `🛡️ ${currentUser.profile?.name || 'Administrador'}`}
                </span>
              </div>
            </div>

            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-xl border border-[#0f4c3a]/20 text-[#0f4c3a] hover:bg-emerald-50 font-semibold transition-all flex items-center gap-1.5 shadow-xs"
              title="Abrir tienda cliente"
            >
              <span>Ver Tienda</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modular Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1 overflow-x-auto border-t border-[#0f4c3a]/10 py-1.5">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'inventory'
                ? 'bg-[#0f4c3a] text-white shadow-xs'
                : 'text-neutral-600 hover:text-[#0f4c3a] hover:bg-emerald-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catálogo ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'orders'
                ? 'bg-[#0f4c3a] text-white shadow-xs'
                : 'text-neutral-600 hover:text-[#0f4c3a] hover:bg-emerald-50'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Órdenes & Validación ({orders.length})</span>
            {orders.filter((o) => o.paymentStatus !== 'VALIDATED').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {orders.filter((o) => o.paymentStatus !== 'VALIDATED').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('kardex')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'kardex'
                ? 'bg-[#0f4c3a] text-white shadow-xs'
                : 'text-neutral-600 hover:text-[#0f4c3a] hover:bg-emerald-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Kardex Calculado ({movements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'profiles'
                ? 'bg-[#0f4c3a] text-white shadow-xs'
                : 'text-neutral-600 hover:text-[#0f4c3a] hover:bg-emerald-50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Perfiles & Permisos</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'users'
                ? 'bg-[#0f4c3a] text-white shadow-xs'
                : 'text-neutral-600 hover:text-[#0f4c3a] hover:bg-emerald-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios & Roles ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'storage'
                ? 'bg-[#0f4c3a] text-white shadow-xs'
                : 'text-neutral-600 hover:text-[#0f4c3a] hover:bg-emerald-50'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Disco C: Storage</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* TAB 1: CATÁLOGO Y FICHAS DE PERFUME */}
        {activeTab === 'inventory' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif-luxury text-2xl sm:text-3xl text-[#0a261a]">
                  Catálogo de Fragancias de Lujo
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Precios retail, promociones, múltiples imágenes y calibración física de inventario.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchData}
                  className="p-2.5 rounded-xl bg-white border border-[#0f4c3a]/20 hover:bg-emerald-50 text-[#0f4c3a] transition-all shadow-xs"
                  title="Refrescar catálogo"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                {canCatalog ? (
                  <button
                    onClick={handleOpenNewModal}
                    className="px-4 py-2.5 rounded-xl bg-[#0f4c3a] hover:bg-[#14634c] text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Perfume</span>
                  </button>
                ) : (
                  <span className="text-[11px] px-3 py-2 bg-neutral-100 text-neutral-500 rounded-xl border border-neutral-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Solo Lectura (Sin Permiso de Edición)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, marca o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c] placeholder-neutral-400 focus:outline-none focus:border-[#0f4c3a] shadow-xs"
              />
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-[#0f4c3a]/15 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fbfbf9] text-neutral-500 uppercase tracking-wider text-[10px] font-bold border-b border-[#0f4c3a]/10">
                    <tr>
                      <th className="py-3 px-4">Fragancia & Portada</th>
                      <th className="py-3 px-4">Familia & Concentración</th>
                      <th className="py-3 px-4">Precio Retail / Oferta</th>
                      <th className="py-3 px-4">Stock en Almacén</th>
                      <th className="py-3 px-4">Imágenes</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0f4c3a]/10">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-[#f4f3ef] border border-[#0f4c3a]/15 shrink-0">
                              <Image src={p.image} alt={p.name} fill className="object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-[#0a261a] text-sm">{p.name}</p>
                              <p className="text-[10px] text-[#0f4c3a] font-semibold">{p.brand}</p>
                              <span className="font-mono text-[9px] text-neutral-500">SKU: {p.sku}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-medium text-[#12241c]">{p.olfactiveFamily}</p>
                          <span className="text-[10px] text-neutral-500">{p.concentration}</span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-sm text-[#0f4c3a]">
                              ${p.price.toFixed(2)}
                            </span>
                            {p.discountPrice && p.retailPrice > p.price && (
                              <span className="text-[10px] text-neutral-400 line-through">
                                ${p.retailPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {p.discountPrice && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800">
                              En Descuento
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded-lg ${
                                p.stock === 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : p.stock <= 5
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.stock} ud.
                            </span>

                            {canCatalog && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleQuickStockAdjust(p.id, 1)}
                                  className="w-6 h-6 rounded bg-neutral-100 hover:bg-[#0f4c3a] hover:text-white text-[#0f4c3a] font-bold text-xs flex items-center justify-center transition-colors shadow-2xs"
                                  title="Agregar +1 al stock (Kardex)"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => handleQuickStockAdjust(p.id, -1)}
                                  disabled={p.stock <= 0}
                                  className="w-6 h-6 rounded bg-neutral-100 hover:bg-rose-600 hover:text-white text-neutral-700 font-bold text-xs flex items-center justify-center transition-colors disabled:opacity-30 shadow-2xs"
                                  title="Restar -1 al stock (Kardex)"
                                >
                                  -
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-[11px] font-medium text-neutral-600">
                            {p.images && p.images.length > 0 ? `${p.images.length} fotos` : '1 foto'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right space-x-1">
                          {canCatalog && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 text-neutral-500 hover:text-[#0f4c3a] hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Editar ficha de perfume"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Eliminar del catálogo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: ÓRDENES, PEDIDOS Y VALIDACIÓN DE PAGO */}
        {activeTab === 'orders' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif-luxury text-2xl sm:text-3xl text-[#0a261a]">
                  Gestión de Pedidos & Validación de Pagos
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Regla de Almacén: <strong className="text-[#0f4c3a]">El stock físico solo se descarga al validar el pago</strong> por un administrador autorizado.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchData}
                  className="p-2.5 rounded-xl bg-white border border-[#0f4c3a]/20 hover:bg-emerald-50 text-[#0f4c3a] transition-all shadow-xs"
                  title="Refrescar órdenes"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                {canOrders && (
                  <button
                    onClick={() => setIsOrderModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#0f4c3a] hover:bg-[#14634c] text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Pedido Asistido</span>
                  </button>
                )}
              </div>
            </div>

            {/* Validation Policy Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-[#0a261a] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0f4c3a] shrink-0" />
                <div>
                  <p className="font-bold">Política de Seguridad en Despacho:</p>
                  <p className="text-neutral-600">
                    Los clientes colocan pedidos con estado <em>Pendiente de Validación</em>. Al pulsar <strong>[Validar Pago]</strong> se descarga el stock atómicamente y se genera el asiento de auditoría en el Kardex.
                  </p>
                </div>
              </div>

              {!canValidatePayments && (
                <span className="text-[10px] px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg shrink-0 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Tu perfil actual no autoriza pagos</span>
                </span>
              )}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-[#0f4c3a]/15 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fbfbf9] text-neutral-500 uppercase tracking-wider text-[10px] font-bold border-b border-[#0f4c3a]/10">
                    <tr>
                      <th className="py-3 px-4">N° Pedido / Fecha</th>
                      <th className="py-3 px-4">Cliente / Contacto</th>
                      <th className="py-3 px-4">Total / Método</th>
                      <th className="py-3 px-4">Estado de Pago & Stock</th>
                      <th className="py-3 px-4">Validado Por</th>
                      <th className="py-3 px-4 text-right">Validación / ERP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0f4c3a]/10">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-mono font-bold text-sm text-[#0f4c3a]">{o.orderNumber}</p>
                          <p className="text-[10px] text-neutral-500">
                            {new Date(o.createdAt).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-[#0a261a]">{o.customerName}</p>
                          <p className="text-neutral-500 text-[10px]">Tel: {o.customerPhone}</p>
                          <p className="text-neutral-500 text-[10px]">{o.shippingCity}</p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-[#0a261a]">${o.totalAmount.toFixed(2)} USD</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-medium">
                            {o.paymentMethod}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {o.paymentStatus === 'VALIDATED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Pago Validado (Stock Descargado)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-300 animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pendiente Validación (Stock NO Descargado)</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {o.paymentValidatedBy ? (
                            <div>
                              <p className="font-semibold text-[#0a261a] text-[11px]">{o.paymentValidatedBy.split('@')[0]}</p>
                              <p className="text-[9px] text-neutral-500">
                                {o.paymentValidatedAt ? new Date(o.paymentValidatedAt).toLocaleDateString() : ''}
                              </p>
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-[11px] italic">Sin validar</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right space-x-2">
                          {/* Botón Validar Pago */}
                          {o.paymentStatus !== 'VALIDATED' ? (
                            canValidatePayments ? (
                              <button
                                onClick={() => handleValidatePayment(o.id, o.orderNumber)}
                                className="px-3 py-1.5 rounded-lg bg-[#0f4c3a] hover:bg-[#14634c] text-white font-bold text-[11px] uppercase tracking-wider shadow-xs transition-all inline-flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Validar Pago</span>
                              </button>
                            ) : (
                              <button
                                disabled
                                className="px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-400 font-medium text-[11px] cursor-not-allowed inline-flex items-center gap-1"
                                title="No posee permiso para validar pagos"
                              >
                                <Lock className="w-3 h-3" />
                                <span>Validar</span>
                              </button>
                            )
                          ) : null}

                          {/* Exportar JSON ERP */}
                          {canErpExport && (
                            <button
                              onClick={() => handleExportErp(o.id, o.orderNumber)}
                              className="p-1.5 rounded-lg text-[#0f4c3a] hover:bg-emerald-50 border border-[#0f4c3a]/20 transition-all inline-flex items-center gap-1 text-[11px] font-semibold"
                              title="Descargar Ficha Contable ERP"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>ERP</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: KARDEX CALCULADO (MOVIMIENTOS DE INVENTARIO) */}
        {activeTab === 'kardex' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif-luxury text-2xl sm:text-3xl text-[#0a261a]">
                  Kardex de Inventario & Libro Mayor
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Trazabilidad matemática continua: <em>Saldo = Saldo Anterior + Entrada - Salida</em>. Registro de responsable y referencia.
                </p>
              </div>

              {/* Filtro por Perfume */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-semibold">Filtrar Perfume:</span>
                <select
                  value={kardexFilterProduct}
                  onChange={(e) => setKardexFilterProduct(e.target.value)}
                  className="px-3 py-2 bg-white border border-[#0f4c3a]/25 rounded-xl text-xs text-[#12241c] focus:outline-none focus:border-[#0f4c3a] shadow-xs"
                >
                  <option value="all">Todos los Perfumes ({products.length})</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kardex Ledger Table */}
            <div className="bg-white rounded-2xl border border-[#0f4c3a]/15 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fbfbf9] text-neutral-500 uppercase tracking-wider text-[10px] font-bold border-b border-[#0f4c3a]/10">
                    <tr>
                      <th className="py-3 px-4">Fecha & Hora</th>
                      <th className="py-3 px-4">Perfume (SKU)</th>
                      <th className="py-3 px-4">Referencia / Comprobante</th>
                      <th className="py-3 px-4">Concepto / Tipo</th>
                      <th className="py-3 px-4 text-center text-emerald-800">Entrada (+)</th>
                      <th className="py-3 px-4 text-center text-rose-800">Salida (-)</th>
                      <th className="py-3 px-4 text-center text-[#0f4c3a] font-black">Saldo Resultante</th>
                      <th className="py-3 px-4">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0f4c3a]/10 font-mono">
                    {filteredMovements.map((m) => {
                      const isEntry = (m.inQuantity > 0) || (m.changeQuantity > 0 && m.type === 'MANUAL_RESTOCK');
                      const isExit = (m.outQuantity > 0) || (m.changeQuantity < 0 && m.type === 'SALE_DEDUCTION');
                      const entryQty = m.inQuantity || (m.changeQuantity > 0 ? m.changeQuantity : 0);
                      const exitQty = m.outQuantity || (m.changeQuantity < 0 ? Math.abs(m.changeQuantity) : 0);

                      return (
                        <tr key={m.id} className="hover:bg-emerald-50/40 transition-colors font-sans">
                          <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">
                            {new Date(m.createdAt).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-bold text-[#0a261a]">{m.productName || 'Perfume'}</p>
                            <span className="text-[10px] text-[#0f4c3a] font-mono">{m.productSku}</span>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-[#0f4c3a]">
                            {m.reference || (m.orderNumber ? `Pedido #${m.orderNumber}` : 'AJUSTE-MANUAL')}
                          </td>

                          <td className="py-3 px-4 text-[11px] text-neutral-600">
                            {m.note || (m.type === 'SALE_DEDUCTION' ? 'Venta Validada' : 'Ingreso Almacén')}
                          </td>

                          {/* Entrada */}
                          <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                            {entryQty > 0 ? `+${entryQty}` : '—'}
                          </td>

                          {/* Salida */}
                          <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                            {exitQty > 0 ? `-${exitQty}` : '—'}
                          </td>

                          {/* Saldo Calculado */}
                          <td className="py-3 px-4 text-center font-mono font-bold text-sm bg-emerald-50/50 text-[#0f4c3a]">
                            {m.balance ?? m.newStock} ud.
                          </td>

                          <td className="py-3 px-4 text-[11px] text-neutral-600">
                            {m.user ? m.user.split('@')[0] : 'superadmin'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: PERFILES & PERMISOS (RBAC) */}
        {activeTab === 'profiles' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif-luxury text-2xl sm:text-3xl text-[#0a261a]">
                  Perfiles de Administrador & Permisos de Módulos
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Configure perfiles personalizados con casillas de verificación para autorizar validación de pagos, catálogo, Kardex y usuarios.
                </p>
              </div>

              {isSuperAdmin && (
                <button
                  onClick={handleOpenNewProfileModal}
                  className="px-4 py-2.5 rounded-xl bg-[#0f4c3a] hover:bg-[#14634c] text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Nuevo Perfil</span>
                </button>
              )}
            </div>

            {/* Profiles Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profiles.map((prof) => (
                <div
                  key={prof.id}
                  className="bg-white rounded-2xl border border-[#0f4c3a]/15 p-6 shadow-sm space-y-4 hover:border-[#0f4c3a]/40 transition-all"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#0f4c3a]/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-[#0f4c3a]/20 flex items-center justify-center text-[#0f4c3a]">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#0a261a]">{prof.name}</h3>
                        <span className="text-[10px] text-neutral-500">Perfil de Seguridad RBAC</span>
                      </div>
                    </div>

                    {isSuperAdmin && (
                      <button
                        onClick={() => {
                          setEditingProfile(prof);
                          setProfileFormData({
                            name: prof.name,
                            description: prof.description || '',
                            canCatalog: prof.canCatalog,
                            canOrders: prof.canOrders,
                            canValidatePayments: prof.canValidatePayments,
                            canKardex: prof.canKardex,
                            canUsers: prof.canUsers,
                            canErpExport: prof.canErpExport,
                          });
                          setIsProfileModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-[#0f4c3a] hover:bg-emerald-50 transition-colors"
                        title="Modificar permisos"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {prof.description || 'Sin descripción detallada.'}
                  </p>

                  {/* Permissions Checklist Badges */}
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                      Módulos & Privilegios Autorizados:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`p-2 rounded-lg border flex items-center gap-2 ${prof.canValidatePayments ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                        {prof.canValidatePayments ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-neutral-300" />}
                        <span>Validar Pagos & Stock</span>
                      </div>

                      <div className={`p-2 rounded-lg border flex items-center gap-2 ${prof.canCatalog ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                        {prof.canCatalog ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-neutral-300" />}
                        <span>Gestión de Catálogo</span>
                      </div>

                      <div className={`p-2 rounded-lg border flex items-center gap-2 ${prof.canOrders ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                        {prof.canOrders ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-neutral-300" />}
                        <span>Pedidos & Ventas</span>
                      </div>

                      <div className={`p-2 rounded-lg border flex items-center gap-2 ${prof.canKardex ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                        {prof.canKardex ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-neutral-300" />}
                        <span>Kardex & Auditoría</span>
                      </div>

                      <div className={`p-2 rounded-lg border flex items-center gap-2 ${prof.canUsers ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                        {prof.canUsers ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-neutral-300" />}
                        <span>Administrar Usuarios</span>
                      </div>

                      <div className={`p-2 rounded-lg border flex items-center gap-2 ${prof.canErpExport ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                        {prof.canErpExport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-neutral-300" />}
                        <span>Exportación ERP</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 5: USUARIOS & ASIGNACIÓN DE PERFILES */}
        {activeTab === 'users' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif-luxury text-2xl sm:text-3xl text-[#0a261a]">
                  Usuarios Registrados & Asignación de Perfiles
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Asigne perfiles con permisos granulares a los operadores de la Maison en PostgreSQL.
                </p>
              </div>

              {isSuperAdmin && (
                <button
                  onClick={() => setIsCreateAdminModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#0f4c3a] hover:bg-[#14634c] text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Nuevo Administrador</span>
                </button>
              )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-[#0f4c3a]/15 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fbfbf9] text-neutral-500 uppercase tracking-wider text-[10px] font-bold border-b border-[#0f4c3a]/10">
                    <tr>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Rol en BD</th>
                      <th className="py-3 px-4">Perfil Asignado</th>
                      <th className="py-3 px-4">Permiso Validar Pago</th>
                      <th className="py-3 px-4">Registrado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0f4c3a]/10">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#0a261a]">{u.name || 'Sin Nombre'}</p>
                          <p className="text-neutral-500 text-[11px] font-mono">{u.email}</p>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'SUPERADMIN'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : u.role === 'ADMIN'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {isSuperAdmin && u.role !== 'SUPERADMIN' ? (
                            <select
                              value={u.profileId || ''}
                              onChange={(e) => handleAssignProfileToUser(u.id, e.target.value)}
                              className="px-2.5 py-1 rounded-lg bg-[#fbfbf9] border border-[#0f4c3a]/20 text-xs font-semibold text-[#12241c] focus:outline-none focus:border-[#0f4c3a]"
                            >
                              <option value="">(Sin Perfil Específico)</option>
                              {profiles.map((prof) => (
                                <option key={prof.id} value={prof.id}>
                                  {prof.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-semibold text-[#0f4c3a]">
                              {u.profile?.name || (u.role === 'SUPERADMIN' ? 'Control Total (Superadmin)' : 'Sin Asignar')}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {u.role === 'SUPERADMIN' || u.profile?.canValidatePayments ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Autorizado</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                              <Lock className="w-3 h-3" />
                              <span>No Autorizado</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 6: DISCO C: STORAGE */}
        {activeTab === 'storage' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="font-serif-luxury text-2xl sm:text-3xl text-[#0a261a]">
                Almacenamiento Físico en Unidad C:
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Archivos guardados en disco local y sincronizados con el servidor web.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#0f4c3a]/15 shadow-sm space-y-2">
                <p className="text-xs uppercase font-bold text-neutral-500">Ruta Física en Servidor</p>
                <p className="font-mono text-xs text-[#0f4c3a] font-bold bg-[#fbfbf9] p-2.5 rounded-xl border border-[#0f4c3a]/10 break-all">
                  C:\ecom-storage\uploads
                </p>
                <p className="text-[11px] text-neutral-500">
                  Persistencia directa sin dependencia de APIs externas.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#0f4c3a]/15 shadow-sm space-y-2">
                <p className="text-xs uppercase font-bold text-neutral-500">Directorio Web Estático</p>
                <p className="font-mono text-xs text-[#0f4c3a] font-bold bg-[#fbfbf9] p-2.5 rounded-xl border border-[#0f4c3a]/10 break-all">
                  public\uploads
                </p>
                <p className="text-[11px] text-neutral-500">
                  Acceso web inmediato por Next.js Image Optimization.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#0f4c3a]/15 shadow-sm space-y-2">
                <p className="text-xs uppercase font-bold text-neutral-500">Integración con PostgreSQL</p>
                <p className="font-mono text-xs text-[#0f4c3a] font-bold bg-[#fbfbf9] p-2.5 rounded-xl border border-[#0f4c3a]/10">
                  ProductImage Table
                </p>
                <p className="text-[11px] text-neutral-500">
                  Vínculo relacional con URL, localPath y orden de visualización.
                </p>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* MODAL 1: CREAR/EDITAR PRODUCTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082d22]/40 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-[#0f4c3a]/25 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#12241c] my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-[#0f4c3a] rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif-luxury text-2xl text-[#0a261a] mb-1">
              {editingProduct ? 'Editar Fragancia en Catálogo' : 'Registrar Nuevo Perfume'}
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Complete la información de venta, precios, stock y galería de imágenes.
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                    Nombre del Perfume
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c] focus:outline-none focus:border-[#0f4c3a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                    Marca / Maison
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c] focus:outline-none focus:border-[#0f4c3a]"
                  />
                </div>
              </div>

              {/* Precios: Retail vs Oferta */}
              <div className="grid grid-cols-3 gap-4 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#0f4c3a] mb-1">
                    Precio Retail (Lista)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-[#0f4c3a]/20 rounded-xl text-xs font-bold text-[#0a261a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#0f4c3a] mb-1">
                    Precio Oferta (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Sin descuento"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-[#0f4c3a]/20 rounded-xl text-xs font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#0f4c3a] mb-1">
                    Stock en Almacén
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-[#0f4c3a]/20 rounded-xl text-xs font-bold text-[#0a261a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                    Familia Olfativa
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.olfactiveFamily}
                    onChange={(e) => setFormData({ ...formData, olfactiveFamily: e.target.value })}
                    className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                    Concentración
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.concentration}
                    onChange={(e) => setFormData({ ...formData, concentration: e.target.value })}
                    className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c]"
                  />
                </div>
              </div>

              {/* Múltiples Imágenes con ImageUploader */}
              <ImageUploader
                images={formData.images}
                onChange={(imgs) => setFormData({ ...formData, images: imgs })}
              />

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                  Descripción & Historia
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0f4c3a] hover:bg-[#14634c] text-white text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Registrar en Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREAR/EDITAR PERFIL (RBAC) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082d22]/40 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white border border-[#0f4c3a]/25 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#12241c]">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-[#0f4c3a] rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif-luxury text-2xl text-[#0a261a] mb-1">
              {editingProfile ? 'Modificar Permisos del Perfil' : 'Crear Nuevo Perfil Operativo'}
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Seleccione con casillas a qué módulos y procesos tendrá acceso este perfil.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                  Nombre del Perfil
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Auditor de Pagos & Tesorería"
                  value={profileFormData.name}
                  onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                  Descripción del Rol
                </label>
                <textarea
                  rows={2}
                  placeholder="Responsabilidades y funciones asignadas..."
                  value={profileFormData.description}
                  onChange={(e) => setProfileFormData({ ...profileFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c]"
                />
              </div>

              <div className="p-4 bg-[#fbfbf9] rounded-2xl border border-[#0f4c3a]/15 space-y-3">
                <p className="text-xs font-bold text-[#0a261a]">Permisos Modulares:</p>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileFormData.canValidatePayments}
                    onChange={(e) => setProfileFormData({ ...profileFormData, canValidatePayments: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0f4c3a] focus:ring-[#0f4c3a]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0a261a]">Validar Pagos & Descargar Stock</span>
                    <p className="text-[10px] text-neutral-500">Autoriza validar transferencias y aplicar la descarga automática en almacén.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileFormData.canCatalog}
                    onChange={(e) => setProfileFormData({ ...profileFormData, canCatalog: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0f4c3a] focus:ring-[#0f4c3a]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0a261a]">Catálogo & Precios</span>
                    <p className="text-[10px] text-neutral-500">Crear perfumes, modificar precios de lista, ofertas y stock.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileFormData.canOrders}
                    onChange={(e) => setProfileFormData({ ...profileFormData, canOrders: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0f4c3a] focus:ring-[#0f4c3a]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0a261a]">Pedidos & Ventas Asistidas</span>
                    <p className="text-[10px] text-neutral-500">Consultar y generar órdenes telefónicas o por WhatsApp.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileFormData.canKardex}
                    onChange={(e) => setProfileFormData({ ...profileFormData, canKardex: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0f4c3a] focus:ring-[#0f4c3a]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0a261a]">Kardex & Auditoría Contable</span>
                    <p className="text-[10px] text-neutral-500">Consultar entradas, salidas y saldos secuenciales en almacén.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileFormData.canUsers}
                    onChange={(e) => setProfileFormData({ ...profileFormData, canUsers: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0f4c3a] focus:ring-[#0f4c3a]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0a261a]">Gestión de Usuarios</span>
                    <p className="text-[10px] text-neutral-500">Asignar perfiles y roles a los miembros del equipo.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileFormData.canErpExport}
                    onChange={(e) => setProfileFormData({ ...profileFormData, canErpExport: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0f4c3a] focus:ring-[#0f4c3a]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0a261a]">Exportación ERP</span>
                    <p className="text-[10px] text-neutral-500">Generar payload JSON para facturación externa.</p>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0f4c3a] hover:bg-[#14634c] text-white text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  Guardar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREAR PEDIDO ASISTIDO */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082d22]/40 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white border border-[#0f4c3a]/25 rounded-3xl p-6 sm:p-8 shadow-2xl text-[#12241c]">
            <button
              onClick={() => setIsOrderModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-[#0f4c3a] rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif-luxury text-2xl text-[#0a261a] mb-1">Crear Pedido Asistido</h2>
            <p className="text-xs text-neutral-500 mb-6">
              Registre ventas generadas por WhatsApp, teléfono o en boutique.
            </p>

            <form onSubmit={handleCreateManualOrder} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                  Perfume Seleccionado
                </label>
                <select
                  value={manualOrderData.productId}
                  onChange={(e) => setManualOrderData({ ...manualOrderData, productId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} - ${p.price.toFixed(2)} ({p.stock} en stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={manualOrderData.quantity}
                    onChange={(e) => setManualOrderData({ ...manualOrderData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={manualOrderData.paymentMethod}
                    onChange={(e) => setManualOrderData({ ...manualOrderData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c]"
                  >
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="YAPE_PLIN">Yape / Plin</option>
                    <option value="EFECTIVO">Efectivo Boutique</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellidos"
                  value={manualOrderData.customerName}
                  onChange={(e) => setManualOrderData({ ...manualOrderData, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                    Teléfono WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+51 900 000 000"
                    value={manualOrderData.customerPhone}
                    onChange={(e) => setManualOrderData({ ...manualOrderData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                    Ciudad de Despacho
                  </label>
                  <input
                    type="text"
                    value={manualOrderData.shippingCity}
                    onChange={(e) => setManualOrderData({ ...manualOrderData, shippingCity: e.target.value })}
                    className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#12241c] mb-1">
                  Dirección de Entrega
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dirección completa"
                  value={manualOrderData.shippingAddress}
                  onChange={(e) => setManualOrderData({ ...manualOrderData, shippingAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-[#fbfbf9] border border-[#0f4c3a]/20 rounded-xl text-xs text-[#12241c]"
                />
              </div>

              {canValidatePayments && (
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={manualOrderData.autoValidatePayment}
                    onChange={(e) => setManualOrderData({ ...manualOrderData, autoValidatePayment: e.target.checked })}
                    className="w-4 h-4 text-[#0f4c3a]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0a261a]">¿Cobro verificado de inmediato?</span>
                    <p className="text-[10px] text-neutral-600">Si se marca, el pago se asienta como VALIDADO y descarga el stock en este instante.</p>
                  </div>
                </label>
              )}

              {manualOrderError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {manualOrderError}
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0f4c3a] hover:bg-[#14634c] text-white text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  Registrar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREAR NUEVO ADMINISTRADOR */}
      <CreateAdminModal
        isOpen={isCreateAdminModalOpen}
        onClose={() => setIsCreateAdminModalOpen(false)}
        onAdminCreated={fetchData}
        requesterEmail={currentUser.email}
      />
    </div>
  );
}
