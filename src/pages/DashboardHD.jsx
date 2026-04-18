import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Table, Tabs, Tag, Skeleton, Descriptions, Form, Modal, App, Select, Divider, Badge, Checkbox, Radio, Space, List, DatePicker, TimePicker, Popconfirm, Flex, Alert } from 'antd';
import { SearchOutlined, UserOutlined, FileTextOutlined, LineChartOutlined, AlertOutlined, HistoryOutlined, HomeOutlined, MedicineBoxOutlined, EyeOutlined, EyeInvisibleOutlined, TeamOutlined, LockOutlined, UnorderedListOutlined, CopyOutlined, ExperimentOutlined, AuditOutlined, CloudUploadOutlined, ContainerOutlined, SafetyCertificateOutlined, CheckCircleOutlined, ArrowRightOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

import API_BASE from '../config';

const SignaturePad = ({ onSave, value }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(!!value);

  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
      setHasContent(true);
    }
  }, [value]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b'; // slate-800

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    if (onSave && canvasRef.current) {
      onSave(canvasRef.current.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    if (onSave) onSave(null);
  };

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden group hover:border-indigo-300 transition-colors">
        <canvas
          ref={canvasRef}
          width={400}
          height={160}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
          onTouchMove={(e) => { e.preventDefault(); draw(e); }}
          onTouchEnd={endDrawing}
          className="w-full h-[140px] cursor-crosshair touch-none"
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
            Tanda tangan di sini...
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex gap-1 group-hover:opacity-100 opacity-0 transition-opacity">
          <Button size="small" shape="circle" icon={<MedicineBoxOutlined />} onClick={clear} title="Bersihkan" />
        </div>
      </div>
      <div className="flex justify-between items-center text-[10px] text-slate-500">
        <span>Gunakan Mouse/Touchpad</span>
        <Button size="small" type="link" danger className="h-auto p-0 text-[10px]" onClick={clear}>Hapus Tanda Tangan</Button>
      </div>
    </div>
  );
};

const DashboardHD = ({ user }) => {
  const canEdit = user?.role === 'admin' || user?.privileges?.hd === 'rw';
  const [loading, setLoading] = useState(false);
  const [switchingPatient, setSwitchingPatient] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMrSearchModalOpen, setIsMrSearchModalOpen] = useState(false);
  const [mrSearchTerm, setMrSearchTerm] = useState('');
  const [mrHistoryResults, setMrHistoryResults] = useState([]);
  const [mrSearchLoading, setMrSearchLoading] = useState(false);
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const [isSoapUnlocked, setIsSoapUnlocked] = useState(false);
  const [cpptData, setCpptData] = useState([]);
  const [ewsData, setEwsData] = useState([]);
  const [codeBlueData, setCodeBlueData] = useState([]);
  const [transferData, setTransferData] = useState([]);
  const [monHdTran, setMonHdTran] = useState(null);
  const [monHdItems, setMonHdItems] = useState([]);
  const [editingSoap, setEditingSoap] = useState(null);

  // PPA state
  const [currentPPA, setCurrentPPA] = useState(null);
  const [isPPAModalOpen, setIsPPAModalOpen] = useState(false);
  const [ruangHD, setRuangHD] = useState(null);
  const [profesiList, setProfesiList] = useState([]);
  const [pegawaiSearchText, setPegawaiSearchText] = useState('');
  const [pegawaiSearchResults, setPegawaiSearchResults] = useState([]);
  const [selectedPegawai, setSelectedPegawai] = useState(null);
  const [selectedProfesi, setSelectedProfesi] = useState(null);
  const [ppaPassword, setPpaPassword] = useState('');
  const [ppaSearchLoading, setPpaSearchLoading] = useState(false);
  const [ppaSubmitLoading, setPpaSubmitLoading] = useState(false);
  const [changePwdMode, setChangePwdMode] = useState(false);
  const [changePwdForm] = Form.useForm();
  const [pegawaiHighlightIdx, setPegawaiHighlightIdx] = useState(-1);
  const passwordInputRef = useRef(null);

  // Role check: Dokter usually has kd_profesi '1'
  const isDokter = currentPPA?.kd_profesi === '1' || currentPPA?.kd_profesi === 1 || (currentPPA?.nama_profesi && currentPPA.nama_profesi.toLowerCase().includes('dokter'));
  const [showTTV, setShowTTV] = useState(true);

  // Sync showTTV with isDokter when currentPPA changes
  useEffect(() => {
    setShowTTV(!isDokter);
  }, [isDokter]);

  // Sidebar Shortcut Listener
  useEffect(() => {
    const handleSetTab = (e) => {
      if (selectedPatient) {
        const targetTab = e.detail;
        if (targetTab === '3' && !isSoapUnlocked) {
          showSoapConfirmation(targetTab);
        } else {
          setActiveTab(targetTab);
        }
      } else {
        message.warning('Pilih pasien terlebih dahulu');
      }
    };
    window.addEventListener('set-active-tab', handleSetTab);
    return () => window.removeEventListener('set-active-tab', handleSetTab);
  }, [selectedPatient, message, isSoapUnlocked, currentPPA]);

  const showSoapConfirmation = (targetTab = '3') => {
    if (!currentPPA) {
      modal.warning({
        title: 'PPA Belum Terpilih',
        content: 'Silahkan pilih PPA terlebih dahulu sebelum mengisi SOAP.',
        okText: 'Pilih PPA',
        onOk: () => setIsPPAModalOpen(true)
      });
      return;
    }

    modal.confirm({
      title: 'Konfirmasi Identitas Pemberi Asuhan',
      width: 400,
      content: (
        <div className="p-2">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex flex-col gap-2">
              <div>
                <span className="text-xs text-blue-600 block font-semibold uppercase tracking-wider">Nama Petugas</span>
                <span className="text-base font-bold text-slate-800">{currentPPA?.nama}</span>
              </div>
              <div className="mt-2 text-xs border-t border-blue-200 pt-2">
                <span className="text-xs text-blue-600 block font-semibold uppercase tracking-wider">Profesi</span>
                <span className="text-sm font-semibold text-slate-700">{currentPPA?.nama_profesi || '-'}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-4 leading-relaxed italic">
            *Pastikan identitas di atas sesuai dengan Anda. Data SOAP akan tercatat menggunakan akun ini.
          </p>
        </div>
      ),
      okText: 'Ya, Lanjutkan',
      cancelText: 'Ganti PPA',
      onOk: () => {
        setIsSoapUnlocked(true);
        setActiveTab(targetTab);
      },
      onCancel: () => {
        setIsPPAModalOpen(true);
      }
    });
  };
  const [ewsForm] = Form.useForm();

  // Asesmen Awal state
  const [assAwalData, setAssAwalData] = useState([]);
  const [assAwalForm] = Form.useForm();
  const [showAssAwalForm, setShowAssAwalForm] = useState(false);
  const [editingAssAwal, setEditingAssAwal] = useState(null);

  // Monitoring HD state
  const [deviceHdList, setDeviceHdList] = useState([]);
  const [monForm] = Form.useForm();
  const [monItemForm] = Form.useForm();
  const [showMonItemForm, setShowMonItemForm] = useState(false);
  const [editingMonItem, setEditingMonItem] = useState(null);

  const [ewsParameters, setEwsParameters] = useState({
    kesadaran: 0,
    suhu: 0,
    tekanan_sistolik: 0,
    denyut_nadi: 0,
    respirasi: 0,
    saturasi_oksigen: 0,
    perdarahan: 0,
    intensive: 0
  });
  const [showEwsForm, setShowEwsForm] = useState(false);
  const [editingEws, setEditingEws] = useState(null);



  // Code Blue state
  const [codeBlueForm] = Form.useForm();
  const [showCodeBlueForm, setShowCodeBlueForm] = useState(false);
  const [editingCodeBlue, setEditingCodeBlue] = useState(null);

  // Template SOAP state
  const [templateVisible, setTemplateVisible] = useState(false);
  const [templateType, setTemplateType] = useState(null);
  const [templateList, setTemplateList] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateInput, setTemplateInput] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  const [isSdkiMode, setIsSdkiMode] = useState(false);
  const [selectedSdkiDiag, setSelectedSdkiDiag] = useState(null);
  const [sdkiPlanSelected, setSdkiPlanSelected] = useState([]);

  // Copy SOAP state
  const [copySOAPVisible, setCopySOAPVisible] = useState(false);
  const [copySOAPSource, setCopySOAPSource] = useState(null);
  const [copySOAPParts, setCopySOAPParts] = useState(['S', 'O', 'A', 'P']);

  const clearAllPatientStates = () => {
    // Basic Patient Data
    setEditingSoap(null);
    setCpptData([]);
    setEwsData([]);
    setCodeBlueData([]);
    setTransferData([]);
    setMonHdTran(null);
    setMonHdItems([]);
    setAssAwalData([]);
    setOrderLabData([]);
    setIsSdkiMode(false);
    setSelectedSdkiDiag(null);
    setSdkiPlanSelected([]);
    setIsSoapUnlocked(false);

    // Signatures
    setSignaturePatient(null);
    setSignaturePemberi(null);
    setSignaturePenerima(null);

    // Editing States
    setEditingAssAwal(null);
    setEditingTransfer(null);
    setEditingCodeBlue(null);
    setEditingEws(null);
    setEditingOrderLab(null);
    setDialisisData(null);
    setTransfusiData(null);

    // Visibility & Parameters
    setShowEwsForm(false);
    setShowMonItemForm(false);
    setShowAssAwalForm(false);
    setShowCodeBlueForm(false);
    setTransferType('OUT');
    setEwsParameters({
      kesadaran: 0,
      suhu: 0,
      tekanan_sistolik: 0,
      denyut_nadi: 0,
      respirasi: 0,
      saturasi_oksigen: 0,
      suplemen_o2: 0,
      perdarahan: 0,
      intensive: 0
    });

    // Form Resets
    saferResetFields(form);
    form.setFieldsValue({ tgl_periksa: dayjs() });
    saferResetFields(assAwalForm);
    saferResetFields(monForm);
    saferResetFields(monItemForm);
    saferResetFields(ewsForm);
    saferResetFields(codeBlueForm);
    saferResetFields(transferForm);
    saferResetFields(orderLabForm);
    saferResetFields(transfusiForm);
  };

  // Transfer Internal state
  const [transferForm] = Form.useForm();
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [transferType, setTransferType] = useState('OUT'); // default outgoing
  const [allRuangList, setAllRuangList] = useState([]);

  // Laporan Dialisis & Transfusi state
  const [dialisisForm] = Form.useForm();
  const [transfusiForm] = Form.useForm();
  const [dialisisData, setDialisisData] = useState(null);
  const [transfusiData, setTransfusiData] = useState(null);
  const [signaturePatient, setSignaturePatient] = useState(null);
  const [signaturePemberi, setSignaturePemberi] = useState(null);
  const [signaturePenerima, setSignaturePenerima] = useState(null);

  // Order Laborat state
  const [orderLabData, setOrderLabData] = useState([]);
  const [dokterList, setDokterList] = useState([]);
  const [editingOrderLab, setEditingOrderLab] = useState(null);
  const [orderLabForm] = Form.useForm();

  useEffect(() => {
    fetchPatientsToday();
    fetchProfesi();
    fetchRuangHD();
    fetchAllRuang();
    fetchDeviceHD();
    fetchDokter();

    const handleOpenSearch = () => setIsSearchModalOpen(true);
    const handleOpenMrSearch = () => setIsMrSearchModalOpen(true);
    const handleOpenPPA = () => setIsPPAModalOpen(true);
    window.addEventListener('open-patient-search', handleOpenSearch);
    window.addEventListener('open-mr-search', handleOpenMrSearch);
    window.addEventListener('open-ppa-modal', handleOpenPPA);
    return () => {
      window.removeEventListener('open-patient-search', handleOpenSearch);
      window.removeEventListener('open-mr-search', handleOpenMrSearch);
      window.removeEventListener('open-ppa-modal', handleOpenPPA);
    };
  }, []);

  const fetchProfesi = async () => {
    try {
      const resp = await axios.get(`${API_BASE}/profesi`);
      setProfesiList(resp.data);
    } catch (e) {
      console.error('Gagal mengambil data profesi', e);
    }
  };

  const fetchRuangHD = async () => {
    try {
      const resp = await axios.get(`${API_BASE}/ruang-hd`);
      setRuangHD(resp.data);
    } catch (e) {
      console.error('Gagal mengambil data ruang HD', e);
    }
  };

  const fetchAllRuang = async () => {
    try {
      const resp = await axios.get(`${API_BASE}/all-ruang`);
      setAllRuangList(resp.data);
    } catch (e) {
      console.error('Gagal mengambil data semua ruang', e);
    }
  };

  const fetchDeviceHD = async () => {
    try {
      const resp = await axios.get(`${API_BASE}/device-hd`);
      setDeviceHdList(resp.data);
    } catch (e) {
      console.error('Gagal mengambil data device HD', e);
    }
  };

  const fetchDokter = async () => {
    try {
      const resp = await axios.get(`${API_BASE}/dokter`);
      setDokterList(resp.data);
    } catch (e) {
      console.error('Gagal mengambil data dokter', e);
    }
  };

  const fetchOrderLab = async (mutNo) => {
    try {
      const resp = await axios.get(`${API_BASE}/order-lab/${mutNo}`);
      setOrderLabData(resp.data);
    } catch (e) {
      console.error('Gagal mengambil data order lab', e);
    }
  };

  const ktvK = Form.useWatch('ktv_k', form);
  const ktvT = Form.useWatch('ktv_t', form);
  const ktvV = Form.useWatch('ktv_v', form);

  useEffect(() => {
    if (ktvK && ktvT && ktvV) {
      const k = parseFloat(ktvK);
      const t = parseFloat(ktvT);
      const v = parseFloat(ktvV);
      if (!isNaN(k) && !isNaN(t) && !isNaN(v) && v !== 0) {
        const result = ((k * t) / v).toFixed(2);
        form.setFieldsValue({
          kt_v: result,
          adekuasi_cairan: result
        });
      }
    }
  }, [ktvK, ktvT, ktvV, form]);

  const handleEditSoap = (record) => {
    setEditingSoap(record);
    setActiveTab('3'); // Switch to SOAP tab

    // Parse values from objektif if needed or just populate what we have
    // Note: The objective in DB might already contain [HD DATA: ...]
    // We try to clean it back for the textarea
    const cleanObjektif = record.objektif?.replace(/\n\[HD DATA:.*\]$/, '') || '';

    form.setFieldsValue({
      ...record,
      tgl_periksa: record.tgl_periksa ? dayjs(record.tgl_periksa) : dayjs(),
      objektif: cleanObjektif,
      // Populasis extra fields if available in record
      // (Backend provides them separately in ass_ralan)
    });

    message.info('Mode Edit: Silahkan perbarui data SOAP');
  };

  const handleDeleteSoap = (id) => {
    modal.confirm({
      title: 'Konfirmasi Hapus',
      content: 'Apakah Anda yakin ingin menghapus data SOAP ini?',
      okText: 'Hapus',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE}/soap/${id}`);
          message.success('SOAP berhasil dihapus');
          fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
        } catch (e) {
          message.error('Gagal menghapus SOAP');
        }
      }
    });
  };

  const handleCpptDetail = (record) => {
    let implVal = record.implementation?.trim() || '';
    let evalVal = record.evaluation?.trim() || '';

    Modal.confirm({
      title: 'Isi Implementation & Evaluation',
      icon: null,
      width: 640,
      content: (
        <div className="space-y-4 mt-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800">
            <div><strong>SOAP #{record.ass_no}</strong> — {dayjs(record.tgl_periksa).format('DD/MM/YYYY HH:mm')}</div>
            <div className="mt-1">Petugas: {record.nama_petugas || '-'}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Implementation (I)</label>
            <Input.TextArea
              rows={6}
              defaultValue={implVal}
              placeholder="Tindakan yang dilakukan..."
              onChange={e => { implVal = e.target.value; }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Evaluation (E)</label>
            <Input.TextArea
              rows={6}
              defaultValue={evalVal}
              placeholder="Hasil evaluasi..."
              onChange={e => { evalVal = e.target.value; }}
            />
          </div>
        </div>
      ),
      okText: 'Simpan',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await axios.post(`${API_BASE}/cppt-detail`, {
            ass_no: record.ass_no,
            mut_no: selectedPatient.mut_no,
            implementation: implVal,
            evaluation: evalVal,
            user_id: user?.nama || 'ADMIN',
          });
          message.success('Implementation & Evaluation berhasil disimpan');
          await fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
        } catch (e) {
          console.error(e);
          message.error('Gagal menyimpan detail CPPT');
        }
      }
    });
  };

  const handleNextFocus = (e, nextId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextEl = document.getElementById(nextId);
      if (nextEl) {
        nextEl.focus();
        if (nextEl.select) nextEl.select();
      }
    }
  };

  const updateObjectiveWithVitals = () => {
    const values = form.getFieldsValue();
    const vitals = [
      values.suhu ? `Suhu: ${values.suhu}°C` : null,
      values.nadi ? `Nadi: ${values.nadi}x/mnt` : null,
      values.tensi ? `Tensi: ${values.tensi}mmHg` : null,
      values.rr ? `RR: ${values.rr}x/mnt` : null,
      values.spo2 ? `SPO2: ${values.spo2}%` : null,
      values.bb_pre_hd ? `BB Pre: ${values.bb_pre_hd}kg` : null,
      values.tb ? `TB: ${values.tb}cm` : null,
      values.kt_v ? `KT/V: ${values.kt_v}` : null,
      values.ulor ? `Ulor: ${values.ulor}L` : null,
      values.bb_kering ? `BB Kering: ${values.bb_kering}kg` : null,
      values.bb_post_hd_sblmnya ? `BB Post: ${values.bb_post_hd_sblmnya}kg` : null,
      values.tindakan_hd_ke ? `HD Ke: ${values.tindakan_hd_ke}` : null,
      values.egfr ? `eGFR: ${values.egfr}` : null,
      values.akses_vaskuler ? `Akses: ${values.akses_vaskuler}` : null,
      values.tanda_infeksi ? `Infeksi: ${values.tanda_infeksi}` : null,
    ].filter(Boolean).join(', ');

    if (!vitals) return;

    const current = form.getFieldValue('objektif') || '';
    const lines = current.split('\n');
    const firstLine = lines[0];

    // Improved detection: if the first line starts with any of the vital labels
    const vitalLabels = ['Suhu:', 'Tensi:', 'Nadi:', 'RR:', 'BB Pre:', 'BB Kering:', 'Akses:'];
    const isVitalsLine = vitalLabels.some(label => firstLine.startsWith(label));

    if (isVitalsLine) {
      lines[0] = vitals;
    } else {
      lines.unshift(vitals);
    }
    form.setFieldsValue({ objektif: lines.join('\n') });
  };

  const handleGetSoapPerawat = () => {
    if (!cpptData || cpptData.length === 0) {
      message.warning('Tidak ada data CPPT tersedia.');
      return;
    }
    // Cari yang isinya perawat (biasanya kd_profesi '2')
    const perawatSoap = cpptData.find(r =>
      r.nama_profesi === '2' ||
      r.nama_profesi === 2 ||
      (r.nama_profesi_name && r.nama_profesi_name.toLowerCase().includes('perawat'))
    );

    if (perawatSoap) {
      form.setFieldsValue({
        subjektif: perawatSoap.subjektif || '',
        objektif: perawatSoap.objektif || ''
      });
      message.success('Berhasil copy Subjektif & Objektif dari perawat: ' + (perawatSoap.nama_petugas || 'Petugas'));
    } else {
      message.warning('Tidak ditemukan catatan SOAP perawat untuk pasien ini.');
    }
  };

  const searchPegawai = async () => {
    setPpaSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (pegawaiSearchText) params.append('q', pegawaiSearchText);
      if (selectedProfesi) params.append('kd_profesi', selectedProfesi);
      const resp = await axios.get(`${API_BASE}/pegawai?${params}`);
      setPegawaiSearchResults(resp.data);
    } catch (e) {
      console.error(e);
      message.error('Gagal mencari data pegawai');
    } finally {
      setPpaSearchLoading(false);
    }
  };

  const handleSetPPA = async () => {
    if (!selectedPegawai) { message.warning('Pilih nama petugas terlebih dahulu'); return; }
    if (!selectedProfesi) { message.warning('Pilih profesi terlebih dahulu'); return; }
    if (!ppaPassword) { message.warning('Masukkan password'); return; }
    setPpaSubmitLoading(true);
    try {
      const resp = await axios.post(`${API_BASE}/ppa/verify`, {
        no: selectedPegawai.no,
        password: ppaPassword,
      });
      if (resp.data.success) {
        const profesi = profesiList.find(p => p.kd_profesi === selectedProfesi);
        const ppaData = {
          no: selectedPegawai.no,
          nama: selectedPegawai.nama,
          kd_profesi: selectedProfesi,
          nama_profesi: profesi?.nama_profesi || '-',
          ruang: ruangHD,
        };
        setCurrentPPA(ppaData);
        // Kirim event ke MainLayout agar nama PPA + ruang tampil di header
        window.dispatchEvent(new CustomEvent('ppa-changed', { detail: ppaData }));
        message.success(`PPA aktif: ${selectedPegawai.nama} (${profesi?.nama_profesi || '-'})`);
        resetPPAModal();
        setIsPPAModalOpen(false);
      } else {
        message.error('Password salah');
      }
    } catch (e) {
      message.error(e.response?.data?.message || 'Password salah');
    } finally {
      setPpaSubmitLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    if (!currentPPA) { message.warning('Belum ada PPA yang aktif'); return; }
    try {
      const resp = await axios.put(`${API_BASE}/pegawai/password/${currentPPA.no}`, {
        old_password: values.old_password,
        new_password: values.new_password,
      });
      if (resp.data.success) {
        message.success('Password berhasil diubah');
        changePwdForm.resetFields();
        setChangePwdMode(false);
      } else {
        message.error(resp.data.message || 'Gagal mengubah password');
      }
    } catch (e) {
      message.error(e.response?.data?.message || 'Password lama tidak sesuai');
    }
  };

  const resetPPAModal = () => {
    setSelectedPegawai(null);
    setSelectedProfesi(null);
    setPpaPassword('');
    setPegawaiSearchText('');
    setPegawaiSearchResults([]);
    setPegawaiHighlightIdx(-1);
    setChangePwdMode(false);
    // changePwdForm hanya ter-mount saat changePwdMode=true;
    // destroyOnHidden pada Modal sudah otomatis reset form saat ditutup
  };

  const selectPegawaiAtIdx = (idx, results) => {
    const list = results ?? pegawaiSearchResults;
    if (idx < 0 || idx >= list.length) return;
    const record = list[idx];
    setSelectedPegawai(record);
    setPegawaiSearchText(record.nama);
    setPegawaiSearchResults([]);
    setPegawaiHighlightIdx(-1);
    // Pindah fokus ke input password
    setTimeout(() => passwordInputRef.current?.focus(), 50);
  };

  const handlePegawaiSearchKeyDown = (e) => {
    if (!pegawaiSearchResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPegawaiHighlightIdx(i => Math.min(i + 1, pegawaiSearchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPegawaiHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      selectPegawaiAtIdx(pegawaiHighlightIdx >= 0 ? pegawaiHighlightIdx : 0);
    }
  };

  const fetchPatientsToday = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API_BASE}/pasien-hari-ini`);
      setPatients(resp.data.data);
    } catch (error) {
      if (error.response?.status !== 500) { // Don't show error if server is down (likely during testing)
        message.error("Gagal mengambil data pasien");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleReset = () => {
      setSelectedPatient(null);
      setActiveTab('1');
    };
    window.addEventListener('reset-dashboard', handleReset);
    return () => window.removeEventListener('reset-dashboard', handleReset);
  }, []);

  const saferSetFields = (f, vals) => {
    try {
      if (f && f.__INTERNAL__ && f.__INTERNAL__.name !== undefined) {
        f.setFieldsValue(vals);
      }
    } catch (e) { }
  };

  const saferResetFields = (f) => {
    try {
      if (f && f.__INTERNAL__ && f.__INTERNAL__.name !== undefined) {
        f.resetFields();
      }
    } catch (e) { }
  };

  const fetchHistoryByMr = async () => {
    if (!mrSearchTerm) return;
    setMrSearchLoading(true);
    try {
      const resp = await axios.get(`${API_BASE}/pasien-by-mr/${mrSearchTerm}`);
      setMrHistoryResults(resp.data.data);
    } catch (error) {
      console.error(error);
      message.error("Gagal mengambil riwayat pasien");
    } finally {
      setMrSearchLoading(false);
    }
  };

  const handleSelectPatient = async (patient) => {
    setSwitchingPatient(true);
    setSelectedPatient(null);
    clearAllPatientStates();

    try {
      const resp = await axios.get(`${API_BASE}/detail/${patient.mut_no}`);
      setSelectedPatient(resp.data);
      setIsSearchModalOpen(false);

      // No manual reset needed because key={selectedPatient.mut_no} forces remount
      setEditingSoap(null);

      // Clear signature and editing states
      setSignaturePatient(null);
      setSignaturePemberi(null);
      setSignaturePenerima(null);
      setEditingAssAwal(null);
      setEditingTransfer(null);
      setEditingCodeBlue(null);
      setEditingEws(null);

      // Load tabs data - Await this
      await fetchTabData(patient.mut_no, resp.data.mr_no);

      // Delay sedikit agar animasi terlihat smooth
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(error);
      message.error("Gagal mengambil detail pasien");
    } finally {
      setSwitchingPatient(false);
    }
  };

  const fetchCppt = async (mrNo) => {
    try {
      const resp = await axios.get(`${API_BASE}/cppt/${mrNo}`);
      setCpptData(resp.data);
      // Auto-fill Transfusion from SOAP
      if (resp.data && resp.data.length > 0) {
        const today = dayjs().format('YYYY-MM-DD');
        const todaySoaps = resp.data.filter(s => dayjs(s.tgl_periksa).format('YYYY-MM-DD') === today);
        let preSoap = null, postSoap = null;
        if (todaySoaps.length >= 1) preSoap = todaySoaps[todaySoaps.length - 1];
        if (todaySoaps.length >= 2) postSoap = todaySoaps[0];
        const vals = {};
        if (preSoap) {
          vals.mon_ku_sblm = preSoap.objektif || '';
          vals.mon_suhu_sblm = preSoap.suhu || '';
          vals.mon_nadi_sblm = preSoap.nadi || '';
          vals.mon_td_sblm = preSoap.tensi || '';
          vals.mon_rr_sblm = preSoap.rr || '';
        }
        if (postSoap) {
          vals.mon_ku_pasca = postSoap.objektif || '';
          vals.mon_suhu_pasca = postSoap.suhu || '';
          vals.mon_nadi_pasca = postSoap.nadi || '';
          vals.mon_td_pasca = postSoap.tensi || '';
          vals.mon_rr_pasca = postSoap.rr || '';
        }
        saferSetFields(transfusiForm, vals);
      }
    } catch (e) { console.error(e); }
  };

  const fetchEws = async (mutNo) => {
    try {
      const resp = await axios.get(`${API_BASE}/ews/${mutNo}`);
      setEwsData(resp.data);
    } catch (e) { console.error(e); }
  };

  const fetchAssAwal = async (mutNo) => {
    try {
      const resp = await axios.get(`${API_BASE}/ass-awal/${mutNo}`);
      setAssAwalData(resp.data);
      setShowAssAwalForm(true);
      if (resp.data && resp.data.length > 0) {
        setEditingAssAwal(resp.data[0]);
        setTimeout(() => {
          saferSetFields(assAwalForm, {
            ...resp.data[0],
            tgl_periksa: resp.data[0].tgl_periksa ? dayjs(resp.data[0].tgl_periksa) : null,
            bcg: resp.data[0].bcg == 1,
            hepa: resp.data[0].hepa == 1,
            dpt: resp.data[0].dpt == 1,
            polio: resp.data[0].polio == 1,
            campak: resp.data[0].campak == 1,
          });
        }, 100);
      }
    } catch (e) { console.error(e); }
  };

  const fetchMonitoring = async (mutNo) => {
    try {
      const resp = await axios.get(`${API_BASE}/monitoring/${mutNo}`);
      setMonHdTran(resp.data.tran);
      setMonHdItems(resp.data.items);
      if (resp.data.tran) {
        setTimeout(() => {
          saferSetFields(monForm, {
            ...resp.data.tran,
            aw_hd: resp.data.tran.aw_hd ? dayjs(resp.data.tran.aw_hd) : null,
            ak_hd: resp.data.tran.ak_hd ? dayjs(resp.data.tran.ak_hd) : null,
          });
        }, 100);
      }
    } catch (e) { console.error(e); }
  };

  const fetchCodeBlue = async (mutNo) => {
    try {
      const resp = await axios.get(`${API_BASE}/code-blue/${mutNo}`);
      setCodeBlueData(resp.data);
    } catch (e) { console.error(e); }
  };

  const fetchTransfer = async (mutNo) => {
    try {
      const resp = await axios.get(`${API_BASE}/transfer/${mutNo}`);
      setTransferData(resp.data);
    } catch (e) { console.error(e); }
  };

  const fetchTabData = async (mutNo, mrNo, specificTab = null) => {
    const targetTab = specificTab || activeTab;
    console.log(`Lazy Loading Tab: ${targetTab}`);

    switch (targetTab) {
      case '1': // Overview
      case '2': // CPPT
      case '3': // SOAP
        await fetchCppt(mrNo);
        break;
      case '2a': // Asesmen Awal
        await fetchAssAwal(mutNo);
        break;
      case '4': // EWS
        await fetchEws(mutNo);
        break;
      case '5': // Code Blue
        await fetchCodeBlue(mutNo);
        break;
      case 'monitoring':
        await fetchMonitoring(mutNo);
        break;
      case 'order_lab':
        await fetchOrderLab(mutNo);
        break;
      case 'transferPasien': // if any
        await fetchTransfer(mutNo);
        break;
      default:
        break;
    }
  };

  // Effect to load data when tab changes
  useEffect(() => {
    if (selectedPatient && !switchingPatient) {
      fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
    }
  }, [activeTab]);


  const onFinishSoap = async (values) => {
    modal.confirm({
      title: 'Konfirmasi Simpan SOAP',
      content: 'Apakah Anda yakin ingin menyimpan data SOAP/CPPT ini?',
      okText: 'Simpan',
      cancelText: 'Batal',
      onOk: async () => {
        setLoading(true);
        try {
          // Gabungkan field extra ke dalam teks objektif
          const hdExtra = [];
          if (values.bb_kering) hdExtra.push(`BB Kering: ${values.bb_kering} kg`);
          if (values.bb_post_hd_sblmnya) hdExtra.push(`BB Post HD Sblmnya: ${values.bb_post_hd_sblmnya} kg`);
          if (values.tindakan_hd_ke) hdExtra.push(`HD Ke: ${values.tindakan_hd_ke}`);
          if (values.akses_vaskuler) hdExtra.push(`Akses Vaskuler: ${values.akses_vaskuler}`);
          if (values.tanda_infeksi) hdExtra.push(`Tanda Infeksi: ${values.tanda_infeksi}`);
          if (values.egfr) hdExtra.push(`eGFR: ${values.egfr}`);

          const objektifFinal = [
            values.objektif || '',
            hdExtra.length ? `\n[${hdExtra.join(' | ')}]` : '',
          ].join('').trim();

          const payload = {
            mut_no: selectedPatient.mut_no,
            mr_no: selectedPatient.mr_no,
            id_petugas: currentPPA?.no ?? null,
            soap_jns: currentPPA?.kd_profesi ?? null,
            subjektif: values.subjektif || null,
            objektif: objektifFinal || null,
            assesment: values.assesment || null,
            plan: values.plan || null,
            suhu: values.suhu || null,
            nadi: values.nadi || null,
            tensi: values.tensi || null,
            rr: values.rr || null,
            spo2: values.spo2 || null,
            tb: values.tb || null,
            bb: values.bb_pre_hd || null,
            kt_v: values.kt_v || null,
            ktv_k: values.ktv_k || null,
            ktv_t: values.ktv_t || null,
            ktv_v: values.ktv_v || null,
            ulor: values.ulor || null,
            adekuasi_cairan: values.adekuasi_cairan || null,
            bb_kering: values.bb_kering || null,
            bb_pre_hd: values.bb_pre_hd || null,
            bb_post_hd_sblmnya: values.bb_post_hd_sblmnya || null,
            tindakan_hd_ke: values.tindakan_hd_ke || null,
            akses_vaskuler: values.akses_vaskuler || null,
            tanda_infeksi: values.tanda_infeksi || null,
            tgl_periksa: values.tgl_periksa ? values.tgl_periksa.format('YYYY-MM-DD HH:mm:ss') : null,
            egfr: values.egfr || null,
            user_id: user?.nama || null,
            // Fallback for mandatory fields
            id_petugas_tbak: 0,
            tbak_status: '0'
          };

          if (editingSoap) {
            await axios.put(`${API_BASE}/soap/${editingSoap.ass_no}`, payload);
            message.success("CPPT/SOAP berhasil diperbarui");
          } else {
            await axios.post(`${API_BASE}/soap`, payload);
            message.success("CPPT/SOAP berhasil disimpan");
          }

          form.resetFields();
          setEditingSoap(null);
          await fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
          setActiveTab('2'); // Auto switch to CPPT tab after save
        } catch (error) {
          console.error(error);
          message.error("Gagal menyimpan SOAP");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const onFinishOrderLab = async (values) => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      const payload = {
        mut_no: selectedPatient.mut_no,
        mr_no: selectedPatient.mr_no,
        kd_ruang: '517',
        tgl_ren_periksa: values.tgl_ren_periksa ? values.tgl_ren_periksa.format('YYYY-MM-DD') : null,
        ni_dokter: values.ni_dokter,
        diagnosa: values.diagnosa || '',
        order_ket: values.order_ket || '',
        user_id: user?.nama || 'ADMIN'
      };

      if (editingOrderLab) {
        await axios.put(`${API_BASE}/order-lab/${editingOrderLab.ts_order_lab_no}`, payload);
        message.success('Order Laborat berhasil diperbarui');
      } else {
        await axios.post(`${API_BASE}/order-lab`, payload);
        message.success('Order Laborat berhasil disimpan');
      }

      orderLabForm.resetFields();
      setEditingOrderLab(null);
      fetchOrderLab(selectedPatient.mut_no);
    } catch (e) {
      console.error(e);
      message.error('Gagal menyimpan Order Laborat');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrderLab = (record) => {
    setEditingOrderLab(record);
    orderLabForm.setFieldsValue({
      ...record,
      tgl_ren_periksa: record.tgl_ren_periksa ? dayjs(record.tgl_ren_periksa) : null,
    });
  };

  const handleDeleteOrderLab = (id) => {
    modal.confirm({
      title: 'Hapus Order Laborat',
      content: 'Yakin menghapus order ini?',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE}/order-lab/${id}`);
          message.success('Order Laborat dihapus');
          fetchOrderLab(selectedPatient.mut_no);
        } catch (e) {
          message.error('Gagal menghapus');
        }
      }
    });
  };

  const openTemplateModal = async (tipe) => {
    setTemplateType(tipe);
    setTemplateList([]);
    setSdkiPlanSelected([]);
    setTemplateSearch('');
    setTemplateVisible(true);
    setTemplateLoading(true);
    try {
      let url = `${API_BASE}/template-soap?tipe=${tipe}&kd_ruang=617`;
      
      if (isSdkiMode) {
        if (tipe === 'A') {
          url = `${API_BASE}/sdki-asesmen`;
        } else if (tipe === 'P') {
          if (!selectedSdkiDiag) {
            message.warning('Pilih Asesmen (A) berdasar SDKI terlebih dahulu untuk memuat template Plan.');
            setTemplateVisible(false);
            return;
          }
          url = `${API_BASE}/sdki-plan?diag_code=${selectedSdkiDiag}`;
        }
      }

      const resp = await axios.get(url);
      setTemplateList(resp.data || []);
      setTemplateInput('');
      setEditingTemplate(null);
    } catch (e) {
      if (isSdkiMode && tipe === 'P' && !selectedSdkiDiag) return;
      message.error('Gagal mengambil template');
    } finally {
      // Small timeout to prevent state update on unmounted component if closed early
      setTimeout(() => setTemplateLoading(false), 50);
    }
  };

  const applyTemplate = (item) => {
    if (isSdkiMode && templateType === 'A') {
      setSelectedSdkiDiag(item.diag_code); // Save diag_code for Plan later
      const current = form.getFieldValue('assesment') || '';
      form.setFieldsValue({ 'assesment': current ? `${current}\n${item.diag_nama}` : item.diag_nama });
      // Reset plan automatically when assesment is changed in SDKI mode
      form.setFieldsValue({ 'plan': '' });
      setTemplateVisible(false);
      message.success(`Diagnosa SDKI ditetapkan. Lanjut isi Plan.`);
      return;
    }

    const fieldMap = { S: 'subjektif', O: 'objektif', A: 'assesment', P: 'plan' };
    const field = fieldMap[templateType];
    const current = form.getFieldValue(field) || '';
    form.setFieldsValue({ [field]: current ? `${current}\n${item.name}` : item.name });
    setTemplateVisible(false);
  };

  const handleApplySdkiPlan = () => {
    if (sdkiPlanSelected.length === 0) return;
    const current = form.getFieldValue('plan') || '';
    const newPlans = sdkiPlanSelected.map(p => `- ${p.tind_nama}`).join('\n');
    form.setFieldsValue({ 'plan': current ? `${current}\n${newPlans}` : newPlans });
    setSdkiPlanSelected([]);
    setTemplateVisible(false);
  };

  const handleSaveTemplate = async () => {
    if (!templateInput.trim()) return message.warning('Teks template tidak boleh kosong');
    try {
      setTemplateLoading(true);
      if (editingTemplate) {
        await axios.put(`${API_BASE}/template-soap/${editingTemplate.no}`, {
          tipe: templateType,
          name: templateInput,
          kd_ruang: 617
        });
        message.success('Template diubah');
      } else {
        await axios.post(`${API_BASE}/template-soap`, {
          tipe: templateType,
          name: templateInput,
          kd_ruang: 617
        });
        message.success('Template ditambahkan');
      }
      setTemplateInput('');
      setEditingTemplate(null);
      const resp = await axios.get(`${API_BASE}/template-soap?tipe=${templateType}&kd_ruang=617`);
      setTemplateList(resp.data || []);
    } catch (e) {
      message.error('Gagal menyimpan template');
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleDeleteTemplate = (id) => {
    Modal.confirm({
      title: 'Hapus Template?',
      content: 'Apakah Anda yakin ingin menghapus template ini?',
      onOk: async () => {
        try {
          setTemplateLoading(true);
          await axios.delete(`${API_BASE}/template-soap/${id}?tipe=${templateType}`);
          message.success('Template dihapus');
          const resp = await axios.get(`${API_BASE}/template-soap?tipe=${templateType}&kd_ruang=617`);
          setTemplateList(resp.data || []);
        } catch (e) {
          message.error('Gagal menghapus template');
        } finally {
          setTemplateLoading(false);
        }
      }
    });
  };

  const handleCopySOAP = () => {
    if (!copySOAPSource) { message.warning('Pilih data SOAP yang akan dicopy'); return; }
    const fieldMap = { S: 'subjektif', O: 'objektif', A: 'assesment', P: 'plan' };
    const updates = {};
    if (copySOAPParts.includes('S')) updates.subjektif = copySOAPSource.subjektif || '';
    if (copySOAPParts.includes('O')) updates.objektif = copySOAPSource.objektif || '';
    if (copySOAPParts.includes('A')) updates.assesment = copySOAPSource.assesment || '';
    if (copySOAPParts.includes('P')) updates.plan = copySOAPSource.plan || '';
    form.setFieldsValue(updates);
    setCopySOAPVisible(false);
    message.success('SOAP berhasil dicopy ke form');
  };

  const handleEditEws = (record) => {
    setEditingEws(record);
    setEwsParameters({
      kesadaran: record.kesadaran || 0,
      suhu: record.suhu || 0,
      tekanan_sistolik: record.tekanan_sistolik || 0,
      denyut_nadi: record.denyut_nadi || 0,
      respirasi: record.respirasi || 0,
      saturasi_oksigen: record.saturasi_oksigen || 0,
      perdarahan: 0,
      intensive: 0
    });
    setTimeout(() => {
      ewsForm.setFieldsValue({
        gds: record.gds || '',
        skor_nyeri: record.skor_nyeri || '',
        urine_output: record.urine_output || '',
      });
    }, 100);
    setShowEwsForm(true);
  };

  const handleDeleteEws = async (id_item) => {
    modal.confirm({
      title: 'Konfirmasi Hapus',
      content: 'Apakah Anda yakin ingin menghapus data EWS ini?',
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE}/ews/${id_item}`);
          message.success("EWS berhasil dihapus");
          await fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
        } catch (error) {
          console.error(error);
          message.error("Gagal menghapus EWS");
        }
      }
    });
  };

  const onFinishEws = async (values) => {
    setLoading(true);
    try {
      const isBlue = Object.values(ewsParameters).some(v => v === 'BLUE');
      let totalSkor = 0;
      let kategori = 'Risiko Rendah';

      if (isBlue) {
        totalSkor = 0; // Skor numerik 0 tapi kategori Blue
        kategori = 'CODE BLUE (HEPATI NAFAS/JANTUNG)';
      } else {
        totalSkor = Object.values(ewsParameters).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        if (totalSkor >= 7) {
          kategori = 'Risiko Sangat Tinggi (High Risk)';
        } else if (totalSkor >= 5) {
          kategori = 'Risiko Tinggi (Medium Risk)';
        } else if (totalSkor >= 1) {
          kategori = 'Risiko Sedang (Low-Medium Risk)';
        } else {
          kategori = 'Risiko Rendah';
        }
      }

      const formVals = ewsForm.getFieldsValue();
      const data = {
        mut_no: selectedPatient.mut_no,
        mr_no: selectedPatient.mr_no,
        ...ewsParameters,
        gds: formVals.gds || null,
        skor_nyeri: formVals.skor_nyeri || null,
        urine_output: formVals.urine_output || null,
        total_skor: totalSkor,
        kategori: kategori,
        tgl_jam: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        id_petugas: currentPPA?.no ?? null,
        user_id: user?.nama || 'ADMIN',
      };

      const saveAction = async () => {
        if (editingEws) {
          // Update
          await axios.put(`${API_BASE}/ews/${editingEws.id_item}`, data);
          message.success("EWS berhasil diperbarui");
        } else {
          // Create
          await axios.post(`${API_BASE}/ews`, data);
          message.success("EWS berhasil disimpan");
        }
      };

      modal.confirm({
        title: 'Konfirmasi Simpan EWS',
        content: 'Simpan data Early Warning Score (EWS) untuk pasien ini?',
        onOk: async () => {
          await saveAction();
          ewsForm.resetFields();
          setEwsParameters({
            kesadaran: 0,
            suhu: 0,
            tekanan_sistolik: 0,
            denyut_nadi: 0,
            respirasi: 0,
            saturasi_oksigen: 0,
            perdarahan: 0,
            intensive: 0
          });
          setShowEwsForm(false);
          setEditingEws(null);
          // Refresh data
          await fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
        }
      });
    } catch (error) {
      console.error(error);
      message.error(editingEws ? "Gagal memperbarui EWS" : "Gagal menyimpan EWS");
    } finally {
      setLoading(false);
    }
  };

  const onFinishCodeBlue = async (values) => {
    modal.confirm({
      title: 'Konfirmasi Simpan',
      content: 'Apakah Anda yakin ingin menyimpan Rekam Medis Code Blue?',
      onOk: async () => {
        setLoading(true);
        try {
          const data = {
            ...values,
            mut_no: selectedPatient.mut_no,
            mr_no: selectedPatient.mr_no,
            kd_ruang: ruangHD || 'HD',
            id_petugas1: currentPPA?.no ?? null,
            tgl_periksa: values.tgl_periksa ? values.tgl_periksa.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
            tgl_transfer: values.tgl_transfer ? values.tgl_transfer.format('YYYY-MM-DD HH:mm:ss') : null,
          };

          // Convert booleans to tinyint 1 or 0
          const booleanFields = [
            'cb_kriteria_hj', 'cb_kriteria_hn', 'cb_kriteria_gm', 'gm_kriteria_aw', 'gm_kriteria_bre',
            'gm_kriteria_sir', 'gm_kriteria_neu', 'gm_kriteria_ews', 'pm_res_nafas_oro', 'pm_res_nafas_intu',
            'pm_res_nafas_lari', 'pm_ass_nafas_apneu', 'pm_ass_nafas_sesak', 'pm_ass_nafas_sianosis', 'pm_ass_nafas_retraksi',
            'pm_ass_nafas_normal', 'pm_res_bag', 'pm_res_rebreat', 'pm_res_nonrebreat', 'pm_res_lain',
            'pm_sir_nadi', 'pm_sir_taki', 'pm_sir_bradi', 'pm_sir_hipotensi', 'pm_sir_hipertensi', 'pm_sir_irama', 'pm_sir_normal',
            'pm_sir_res', 'pm_sir_res_def', 'pm_sir_res_pasang'
          ];
          booleanFields.forEach(f => {
            if (data[f] === true) data[f] = 1;
            else if (data[f] === false || data[f] === undefined) data[f] = 0;
          });

          if (editingCodeBlue) {
            await axios.put(`${API_BASE}/code-blue/${editingCodeBlue.code_blue_no}`, data);
            message.success('Code Blue berhasil diubah');
          } else {
            await axios.post(`${API_BASE}/code-blue`, data);
            message.success('Code Blue berhasil disimpan');
          }
          setShowCodeBlueForm(false);
          setEditingCodeBlue(null);
          codeBlueForm.resetFields();
          await fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
        } catch (e) {
          console.error(e);
          message.error('Gagal menyimpan Code Blue');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  useEffect(() => {
    if (selectedPatient) {
      setTimeout(() => {
        transferForm.setFieldsValue({ kd_ruang_asal: '517' });
      }, 300);
    }
  }, [selectedPatient, transferForm]);

  const handleEditTransfer = (record) => {
    setEditingTransfer(record);
    setTransferType('OUT');
    transferForm.setFieldsValue({
      ...record,
      tgl_transfer: record.tgl_transfer ? dayjs(record.tgl_transfer) : null,
      tgl_terima: record.tgl_terima ? dayjs(record.tgl_terima) : null,
      tgl_masuk: record.tgl_masuk ? dayjs(record.tgl_masuk) : null,
    });
  };

  const handleTerimaTransfer = (record) => {
    setEditingTransfer(record);
    setTransferType('IN');
    transferForm.setFieldsValue({
      ...record,
      tgl_transfer: record.tgl_transfer ? dayjs(record.tgl_transfer) : null,
      tgl_masuk: record.tgl_masuk ? dayjs(record.tgl_masuk) : null,
      tgl_terima: dayjs(),
      id_petugas2: currentPPA?.no,
    });
  };

  const onFinishTransfer = async (values) => {
    if (!selectedPatient) return;
    try {
      setLoading(true);
      const data = {
        ...values,
        mut_no: selectedPatient.mut_no,
        mr_no: selectedPatient.mr_no,
        trf_int_no: editingTransfer?.trf_int_no || 0,
        id_petugas: values.id_petugas || currentPPA?.no,
        tgl_transfer: values.tgl_transfer ? dayjs(values.tgl_transfer).format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        tgl_terima: values.tgl_terima ? dayjs(values.tgl_terima).format('YYYY-MM-DD HH:mm:ss') : null,
        tgl_masuk: values.tgl_masuk ? dayjs(values.tgl_masuk).format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
      };

      modal.confirm({
        title: 'Konfirmasi Transfer',
        content: 'Apakah Anda yakin ingin menyimpan data Transfer Internal ini?',
        onOk: async () => {
          await axios.post(`${API_BASE}/transfer`, data);
          message.success('Data Transfer Internal berhasil disimpan');
          transferForm.resetFields();
          setEditingTransfer(null);
          await fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
        }
      });
    } catch (error) {
      console.error(error);
      message.error('Gagal menyimpan data transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCodeBlue = (record) => {
    setEditingCodeBlue(record);

    // Reverse convert tinyint to boolean for checkboxes
    const booleans = [
      'cb_kriteria_hj', 'cb_kriteria_hn', 'cb_kriteria_gm', 'gm_kriteria_aw', 'gm_kriteria_bre',
      'gm_kriteria_sir', 'gm_kriteria_neu', 'gm_kriteria_ews', 'pm_res_nafas_oro', 'pm_res_nafas_intu',
      'pm_res_nafas_lari', 'pm_ass_nafas_apneu', 'pm_ass_nafas_sesak', 'pm_ass_nafas_sianosis', 'pm_ass_nafas_retraksi',
      'pm_ass_nafas_normal', 'pm_res_bag', 'pm_res_rebreat', 'pm_res_nonrebreat', 'pm_res_lain',
      'pm_sir_nadi', 'pm_sir_taki', 'pm_sir_bradi', 'pm_sir_hipotensi', 'pm_sir_hipertensi', 'pm_sir_irama', 'pm_sir_normal',
      'pm_sir_res', 'pm_sir_res_def', 'pm_sir_res_pasang'
    ];
    const recValues = {
      ...record,
      tgl_periksa: record.tgl_periksa ? dayjs(record.tgl_periksa) : null,
      tgl_transfer: record.tgl_transfer && record.tgl_transfer !== '0000-00-00 00:00:00' ? dayjs(record.tgl_transfer) : null,
    };
    booleans.forEach(f => {
      recValues[f] = (record[f] == 1);
    });

    codeBlueForm.setFieldsValue(recValues);
    setShowCodeBlueForm(true);
  };

  const handleDeleteCodeBlue = (id) => {
    modal.confirm({
      title: 'Hapus Data Code Blue',
      content: 'Yakin menghapus data Code Blue ini?',
      okText: 'Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE}/code-blue/${id}`);
          message.success('Code Blue dihapus');
          await fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
        } catch (e) {
          message.error('Gagal menghapus Code Blue');
        }
      }
    });
  };

  const renderDialisisTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <Form form={dialisisForm} layout="vertical" onFinish={() => message.success('Data Dialisis tersimpan (Simulasi)')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Laporan Tindakan</p>
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item label="Sifat Tindakan" name="sifat_tindakan" initialValue="REGULER">
                    <Radio.Group buttonStyle="solid" size="small">
                      <Radio.Button value="CITO">CITO</Radio.Button>
                      <Radio.Button value="REGULER">REGULER</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item label="Tanggal" name="tgl_tindakan" initialValue={dayjs()}>
                    <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Form.Item label="Jam Mulai" name="jam_mulai"><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item>
                  <Form.Item label="Jam Selesai" name="jam_selesai"><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item>
                </div>
                <Form.Item label="Dializer" name="dializer" initialValue="SINGLE USE"><Input placeholder="e.g. SINGLE USE" /></Form.Item>
                <Form.Item label="Lama Tindakan" name="lama_tindakan"><Input placeholder="e.g. 5 Jam" /></Form.Item>
                <Form.Item label="Diagnosa" name="diagnosa"><Input placeholder="e.g. CKD" /></Form.Item>
                <Form.Item label="Keterangan" name="keterangan" className="mb-0"><Input.TextArea rows={2} /></Form.Item>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-1">Bukti Pelayanan Dialisis</p>
                <div className="p-3 bg-blue-50 rounded border border-blue-100 text-[11px] text-blue-900 mb-4 leading-relaxed">
                  "Dengan ini saya/keluarga menyatakan telah mendapatkan pelayanan Hemodialisis dengan <b>single use dialyzer</b>, serta mendapatkan penjelasan mengenai prosedur dan risiko tindakan."
                </div>
                <Form.Item label="Nama Penanggung Jawab" name="bukti_nama"><Input placeholder="Nama Penerima/Keluarga" /></Form.Item>
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item label="Umur" name="bukti_umur"><Input placeholder="Tahun" suffix="Th" /></Form.Item>
                  <Form.Item label="Jenis Kelamin" name="bukti_jk">
                    <Select options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} />
                  </Form.Item>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tanda Tangan Penanggung Jawab</p>
                  <SignaturePad onSave={setSignaturePatient} value={signaturePatient} />
                </div>

                <div className="mt-8 pt-4 border-t flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-100">
                    <div>
                      <p className="text-[10px] text-green-700 font-bold uppercase tracking-widest">Petugas (PPA) Verified</p>
                      <p className="text-sm font-bold text-slate-800">{currentPPA?.nama || 'Petugas Aktif'}</p>
                    </div>
                    <div className="w-12 h-12 bg-white rounded border border-green-200 flex items-center justify-center">
                      <SafetyCertificateOutlined className="text-2xl text-green-600" />
                    </div>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 h-12 rounded-xl font-bold shadow-lg"
                    icon={<SafetyCertificateOutlined />}
                    onClick={() => {
                      console.log('Signature Data:', signaturePatient);
                      message.success('Layanan Dialisis Berhasil Difinalisasi dengan Tanda Tangan Digital');
                    }}
                  >
                    Simpan & Finalisasi Layanan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );

  const renderTransfusiTab = () => (
    <div className="space-y-4">
      <Form form={transfusiForm} layout="vertical" onFinish={() => message.success('Data Transfusi tersimpan (Simulasi)')}>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <ContainerOutlined className="text-red-600" /> Laporan Pemberian Transfusi Darah
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <Form.Item label="Tgl Pemberian" name="tgl_pemberian" initialValue={dayjs()}><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item>
            <Form.Item label="Jenis Produk" name="jenis_darah">
              <Select options={[{ value: 'PRC', label: 'PRC' }, { value: 'WBC', label: 'WBC' }, { value: 'TC', label: 'TC' }, { value: 'FFP', label: 'FFP' }]} />
            </Form.Item>
            <Form.Item label="Jumlah Kantong" name="jml_kantong"><Input suffix="Kantong" /></Form.Item>
            <Form.Item label="Golongan Darah" name="gol_darah"><Select options={[{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'AB', label: 'AB' }, { value: 'O', label: 'O' }]} /></Form.Item>
            <Form.Item label="HB" name="hb"><Input suffix="gr%" /></Form.Item>
            <Form.Item label="Riw. Transfusi" name="riw_transfusi"><Radio.Group size="small"><Radio value="1">Ya</Radio><Radio value="0">Tidak</Radio></Radio.Group></Form.Item>
            <Form.Item label="Diagnosis" name="diagnosa" className="md:col-span-2"><Input /></Form.Item>
            <Form.Item label="Keterangan" name="ket" className="md:col-span-2"><Input /></Form.Item>
          </div>
          <Divider className="my-4" />

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <LineChartOutlined className="text-blue-600" /> Monitoring Transfusi Darah
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left" width="150">PARAMETER</th>
                  <th className="border border-gray-300 p-2">SEBELUM</th>
                  <th className="border border-gray-300 p-2">15 MENIT</th>
                  <th className="border border-gray-300 p-2">2 JAM</th>
                  <th className="border border-gray-300 p-2">PASCA</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Keadaan Umum', name: 'ku' },
                  { label: 'Suhu Tubuh (°C)', name: 'suhu' },
                  { label: 'Nadi (x/mnt)', name: 'nadi' },
                  { label: 'TD (mmHg)', name: 'td' },
                  { label: 'Resp. Rate (x/mnt)', name: 'rr' },
                  { label: 'Vol/Warna Urine', name: 'urine' },
                ].map(row => (
                  <tr key={row.name}>
                    <td className="border border-gray-300 p-2 font-semibold bg-gray-50">{row.label}</td>
                    {['sblm', '15m', '2j', 'pasca'].map(col => (
                      <td key={col} className="border border-gray-300 p-1">
                        <Form.Item name={`mon_${row.name}_${col}`} className="mb-0">
                          <Input size="small" variant="borderless" className="text-center" />
                        </Form.Item>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold bg-red-50 text-red-800">Gejala & Reaksi</td>
                  {['sblm', '15m', '2j', 'pasca'].map(col => (
                    <td key={col} className="border border-gray-300 p-2 bg-white">
                      <div className="space-y-1">
                        <Form.Item name={`rx_urtikaria_${col}`} valuePropName="checked" className="mb-0"><Checkbox className="text-[9px]">Urtikaria</Checkbox></Form.Item>
                        <Form.Item name={`rx_demam_${col}`} valuePropName="checked" className="mb-0"><Checkbox className="text-[9px]">Demam</Checkbox></Form.Item>
                        <Form.Item name={`rx_gatal_${col}`} valuePropName="checked" className="mb-0"><Checkbox className="text-[9px]">Gatal</Checkbox></Form.Item>
                        <Form.Item name={`rx_nyeri_dada_${col}`} valuePropName="checked" className="mb-0"><Checkbox className="text-[9px]">Nyeri Dada</Checkbox></Form.Item>
                        <Form.Item name={`rx_syok_${col}`} valuePropName="checked" className="mb-0"><Checkbox className="text-[9px]">Syok</Checkbox></Form.Item>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tanda Tangan Pemberi Darah</p>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <Form.Item name="nama_pemberi" label="Nama Petugas Pemberi" className="mb-3">
                    <Input placeholder="Nama Petugas Bank Darah..." />
                  </Form.Item>
                  <SignaturePad onSave={setSignaturePemberi} value={signaturePemberi} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tanda Tangan Penerima Darah</p>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <Form.Item name="nama_penerima" label="Nama Petugas Penerima" className="mb-3" initialValue={currentPPA?.nama}>
                    <Input placeholder="Nama Petugas Ruangan..." />
                  </Form.Item>
                  <SignaturePad onSave={setSignaturePenerima} value={signaturePenerima} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="default" icon={<HistoryOutlined />} size="large" className="rounded-xl">Bereskan Form</Button>
            <Button type="primary" htmlType="submit" danger size="large" className="rounded-xl px-8 font-bold shadow-lg" icon={<CloudUploadOutlined />}>Simpan & Finalisasi Transfusi</Button>
          </div>
        </div>
      </Form>
    </div>
  );

  const onFinishAssAwal = async (values) => {
    modal.confirm({
      title: 'Konfirmasi Simpan',
      content: 'Apakah Anda yakin ingin menyimpan Asesmen Awal?',
      onOk: async () => {
        setLoading(true);
        try {
          const data = {
            ...values,
            mut_no: selectedPatient.mut_no,
            mr_no: selectedPatient.mr_no,
            kd_ruang: ruangHD || 'HD',
            user_id: currentPPA?.no ?? null,
            tgl_periksa: values.tgl_periksa ? values.tgl_periksa.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
          };
          const booleanFields = ['bcg', 'hepa', 'dpt', 'polio', 'campak', 'edu_hasil', 'edu_tindakan', 'edu_komplikasi'];
          booleanFields.forEach(f => {
            if (data[f] === true) data[f] = 1;
            else if (data[f] === false || data[f] === undefined) data[f] = 0;
          });

          if (editingAssAwal) {
            await axios.put(`${API_BASE}/ass-awal/${editingAssAwal.ass_rj_no}`, data);
            message.success('Asesmen Awal diubah');
          } else {
            await axios.post(`${API_BASE}/ass-awal`, data);
            message.success('Asesmen Awal disimpan');
          }
          setShowAssAwalForm(false);
          setEditingAssAwal(null);
          assAwalForm.resetFields();
          await fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
        } catch (e) {
          console.error(e);
          message.error('Gagal menyimpan Asesmen Awal');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleEditAssAwal = (record) => {
    setEditingAssAwal(record);
    assAwalForm.setFieldsValue({
      ...record,
      tgl_periksa: record.tgl_periksa ? dayjs(record.tgl_periksa) : null,
      bcg: record.bcg == 1,
      hepa: record.hepa == 1,
      dpt: record.dpt == 1,
      polio: record.polio == 1,
      campak: record.campak == 1,
      edu_hasil: record.edu_hasil == 1,
      edu_tindakan: record.edu_tindakan == 1,
      edu_komplikasi: record.edu_komplikasi == 1,
    });
    setShowAssAwalForm(true);
  };

  const handleDeleteAssAwal = (id) => {
    modal.confirm({
      title: 'Hapus Asesmen Awal',
      content: 'Yakin menghapus data ini?',
      okText: 'Hapus',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE}/ass-awal/${id}`);
          message.success('Asesmen Awal dihapus');
          await fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
        } catch (e) {
          message.error('Gagal menghapus');
        }
      }
    });
  };

  const onFinishMonTran = async (values) => {
    modal.confirm({
      title: 'Konfirmasi Simpan',
      content: 'Apakah Anda yakin ingin menyimpan Program HD dan Penyulit ini?',
      onOk: async () => {
        setLoading(true);
        try {
          const data = {
            ...values,
            mut_no: selectedPatient.mut_no,
            mr_no: selectedPatient.mr_no,
            id_petugas: currentPPA?.no ?? null,
            aw_hd: values.aw_hd ? values.aw_hd.format('YYYY-MM-DD HH:mm:ss') : null,
            ak_hd: values.ak_hd ? values.ak_hd.format('YYYY-MM-DD HH:mm:ss') : null,
          };
          const resp = await axios.post(`${API_BASE}/monitoring/tran`, data);
          message.success('Data Program HD berhasil disimpan');
          await fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
        } catch (e) {
          console.error(e);
          message.error('Gagal menyimpan Program HD');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const onFinishMonItem = async (values) => {
    if (!monHdTran) {
      message.warning('Simpan Program HD terlebih dahulu sebelum menambah monitoring');
      return;
    }

    modal.confirm({
      title: 'Konfirmasi Simpan',
      content: 'Apakah Anda yakin ingin menyimpan data Monitoring Tindakan ini?',
      onOk: async () => {
        setLoading(true);
        try {
          const data = {
            ...values,
            mon_hd_tran_no: monHdTran.mon_hd_tran_no,
            jam_periksa: values.jam_periksa ? values.jam_periksa.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
            id_petugas: currentPPA?.no ?? null,
          };

          if (editingMonItem) {
            await axios.put(`${API_BASE}/monitoring/item/${editingMonItem.mon_hd_item_no}`, data);
            message.success('Monitoring item berhasil diubah');
          } else {
            await axios.post(`${API_BASE}/monitoring/item`, data);
            message.success('Monitoring item berhasil ditambahkan');
          }
          setShowMonItemForm(false);
          setEditingMonItem(null);
          monItemForm.resetFields();
          await fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
        } catch (e) {
          console.error(e);
          message.error('Gagal menyimpan monitoring item');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCopyLastMonitoring = () => {
    if (!monHdItems || monHdItems.length === 0) {
      message.warning('Belum ada data monitoring sebelumnya untuk disalin');
      return;
    }
    // Mencari item terakhir berdasarkan jam_periksa
    const sorted = [...monHdItems].sort((a, b) => dayjs(b.jam_periksa).valueOf() - dayjs(a.jam_periksa).valueOf());
    const lastItem = sorted[0];
    monItemForm.setFieldsValue({
      tensi: lastItem.tensi,
      hr: lastItem.hr,
      rr: lastItem.rr,
      suhu: lastItem.suhu,
      spo2: lastItem.spo2,
      ak: lastItem.ak,
      ap: lastItem.ap,
      tmp: lastItem.tmp,
      vp: lastItem.vp,
      qb: lastItem.qb,
      qd: lastItem.qd,
      ufg: lastItem.ufg,
      ufr: lastItem.ufr,
      // jam_periksa tidak kita set agar bisa diisi otomatis/diinput manual yang baru
    });
    message.info('Data berhasil tersalin dari jam ' + dayjs(lastItem.jam_periksa).format('HH:mm:ss'));
  };

  const handleEditMonItem = (record) => {
    setEditingMonItem(record);
    monItemForm.setFieldsValue({
      ...record,
      jam_periksa: record.jam_periksa ? dayjs(record.jam_periksa) : null,
    });
    setShowMonItemForm(true);
  };

  const handleDeleteMonItem = async (id) => {
    modal.confirm({
      title: 'Konfirmasi Hapus',
      content: 'Apakah Anda yakin ingin menghapus data monitoring ini?',
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE}/monitoring/item/${id}`);
          message.success("Monitoring berhasil dihapus");
          await fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
        } catch (error) {
          console.error(error);
          message.error("Gagal menghapus monitoring");
        }
      }
    });
  };


  const hitungUsia = (tgl_lahir) => {
    if (!tgl_lahir) return '-';
    const lahir = dayjs(tgl_lahir);
    const now = dayjs();
    const tahun = now.diff(lahir, 'year');
    const bulan = now.diff(lahir, 'month') % 12;
    if (tahun > 0) return `${tahun} thn`;
    return `${bulan} bln`;
  };

  const columns = [
    { title: 'No RM', dataIndex: 'mr_no', width: 90 },
    {
      title: 'Nama',
      dataIndex: 'nama',
      ellipsis: true,
      render: (v, r) => {
        const hasSoap = r.soaps_today && r.soaps_today.split(',').includes(currentPPA?.kd_profesi?.toString());
        return (
          <Flex align="center" gap={4}>
            {hasSoap && <Badge status="success" text={<span className="text-green-600">✓</span>} />}
            <span>{v}</span>
          </Flex>
        );
      }
    },
    {
      title: 'Jenis',
      width: 110,
      render: (_, r) => {
        const jenis = (r.jenis === 'L' || r.jenis === '1' || r.jenis === 1) ? 'L' : 'P';
        const usia = hitungUsia(r.tgl_lahir);
        return <span className="text-xs font-semibold">{jenis} / {usia}</span>;
      }
    },
    {
      title: 'Alamat',
      ellipsis: true,
      render: (_, r) => {
        const parts = [r.alamat, r.kel, r.kec, r.kab].filter(Boolean);
        return <span className="text-xs text-gray-500">{parts.join(', ') || '-'}</span>;
      }
    },
    {
      title: 'Aksi',
      width: 80,
      render: (_, record) => {
        const hasSoap = record.soaps_today && record.soaps_today.split(',').includes(currentPPA?.kd_profesi?.toString());
        return (
          <Button
            onClick={() => handleSelectPatient(record)}
            size="small"
            icon={hasSoap ? <CheckCircleOutlined className="text-[10px]" /> : <ArrowRightOutlined className="text-[10px]" />}
            className={`
              ${hasSoap
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none px-4"
                : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-none shadow-sm hover:shadow-md transform hover:scale-105 animate-pulse px-4"
              }
              rounded-full flex items-center gap-1 font-bold text-[10px] h-7 transition-all duration-300
            `}
          >
            {hasSoap ? "Pilih" : "Pilih"}
          </Button>
        );
      }
    }
  ];

  const filteredPatients = patients.filter(p =>
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mr_no.toString().includes(searchTerm)
  );

  // Strictly sort by no_antri as requested
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    return (parseInt(a.no_antri) || 0) - (parseInt(b.no_antri) || 0);
  });

  // Find the first patient who hasn't been SOAPed by current PPA (for highlight/focus)
  const firstUnfinished = sortedPatients.find(p => {
    const hasSoap = p.soaps_today && p.soaps_today.split(',').includes(currentPPA?.kd_profesi?.toString());
    return !hasSoap;
  });

  return (
    <div className="space-y-6">
      {!canEdit && (
        <Alert
          message="Mode Baca Saja (Read Only)"
          description="Anda masuk dengan hak akses terbatas untuk modul Hemodialisa. Anda dapat melihat data tetapi tidak memiliki izin menyimpan perubahan."
          type="warning"
          showIcon
          icon={<SafetyCertificateOutlined />}
          className="rounded-2xl border-none shadow-sm bg-orange-50 text-orange-800"
        />
      )}
      {/* Search Section - MOVED TO HEADER, adding breadcrumb/title instead */}
      {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Hemodialisa Monitoring
          </h1>
        </div>
      </div> */}

      {switchingPatient ? (
        <div className="w-full max-w-5xl space-y-8 animate-in fade-in duration-500 mx-auto">
          <Card className="rounded-2xl shadow-sm border-none bg-white/50 backdrop-blur-sm">
            <Skeleton active avatar title={{ width: '30%' }} paragraph={{ rows: 2 }} />
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="rounded-2xl shadow-sm border-none">
                <Skeleton active paragraph={{ rows: 12 }} />
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="rounded-2xl shadow-sm border-none">
                <Skeleton active paragraph={{ rows: 6 }} />
              </Card>
              <Card className="rounded-2xl shadow-sm border-none">
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </div>
          </div>
        </div>
      ) : !selectedPatient ? (
        <>
          {/* Stats Section */}
          {(() => {
            const total = patients.length;
            const selesai = patients.filter(p => p.soaps_today).length;
            const sedang = total - selesai;
            const selesaiPct = total > 0 ? Math.floor((selesai / total) * 100) : 0;
            const sedangPct = 100 - selesaiPct;

            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-indigo-100 text-sm">Total Pasien HD</p>
                      <h3 className="text-3xl font-bold mt-1">{total}</h3>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                      <UserOutlined className="text-xl" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-indigo-200">
                    Terdaftar pada: {dayjs().format('DD MMM YYYY')}
                  </div>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm">Sedang HD</p>
                      <h3 className="text-3xl font-bold mt-1 text-gray-800">{sedang}</h3>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <HistoryOutlined className="text-xl text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${sedangPct}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-400">{sedangPct}%</span>
                  </div>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm">Selesai</p>
                      <h3 className="text-3xl font-bold mt-1 text-gray-800">{selesai}</h3>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg">
                      <Tag color="success" className="m-0 border-none px-0"><LineChartOutlined className="text-xl" /></Tag>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${selesaiPct}%` }}></div>
                    </div>
                    <span className="text-xs text-green-500 font-medium">{selesaiPct}% Done</span>
                  </div>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                  <p className="text-gray-500 text-sm mb-2">Trend 7 Hari Pasien</p>
                  <div className="h-24 flex items-end gap-1.5 px-1">
                    {[30, 45, 25, 60, 40, 50, total > 0 ? Math.min((total / 40) * 100, 100) : 10].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 ${i === 6 ? 'bg-indigo-600' : 'bg-indigo-200'} rounded-t-md transition-all hover:bg-indigo-400`}
                        style={{ height: `${h}%` }}
                        title={`Hari ${i + 1}`}
                      ></div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between px-1 text-[10px] text-gray-400 font-mono">
                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                  </div>
                </Card>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="rounded-2xl border-none shadow-sm h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Kapasitas Unit HD</h3>
                <Tag color="processing">Real-time</Tag>
              </div>
              <div className="flex items-center gap-10">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="50" fill="transparent" stroke="#eef2ff" strokeWidth="12" />
                    <circle cx="64" cy="64" r="50" fill="transparent" stroke="#6d28d9" strokeWidth="12"
                      strokeDasharray="314" strokeDashoffset={314 * (1 - 0.75)}
                      strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">75%</span>
                    <span className="text-[10px] text-gray-400">Terpakai</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-600"></div> Terisi</span>
                    <span className="font-semibold">30 Bed</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-200"></div> Tersedia</span>
                    <span className="font-semibold">10 Bed</span>
                  </div>
                  <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400 italic">
                    *Kapasitas maksimal 40 bed per shift
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm h-full bg-softBlue">
              <h3 className="text-lg font-bold mb-4">Efisiensi Dializer Hari Ini</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Re-use Dializer (Siklus 1-3)</span>
                    <span className="font-bold">85%</span>
                  </div>
                  <div className="h-2 bg-white rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Re-use Dializer (Siklus &gt;3)</span>
                    <span className="font-bold">12%</span>
                  </div>
                  <div className="h-2 bg-white rounded-full"><div className="h-full bg-orange-500 rounded-full" style={{ width: '12%' }}></div></div>
                </div>
                <div className="p-3 bg-white/50 rounded-xl text-xs text-indigo-600 mt-4">
                  <AlertOutlined /> <strong>Info:</strong> Efisiensi re-use meningkat 5% dari shift sebelumnya.
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <div key={selectedPatient.mut_no} className="animate-fadeIn">
          {/* Patient Header (Modern Gradient Design) */}
          <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-3xl shadow-lg border border-white/50 overflow-hidden mb-6 transition-all duration-300 hover:shadow-xl">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400 to-pink-400 rounded-full translate-y-12 -translate-x-12"></div>
            </div>

            <div className="relative flex items-stretch min-h-[100px]">
              {/* Left Accent Gradient */}
              <div className="w-1 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500"></div>

              {/* Patient Avatar & Basic Info */}
              <div className="flex items-center px-6 py-4 bg-white/70 backdrop-blur-sm border-r border-white/30">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {selectedPatient.nama?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-1">{selectedPatient.nama}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      MR: <span className="font-mono font-semibold text-blue-600">{selectedPatient.mr_no}</span>
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      {(selectedPatient.jenis === 'L' || selectedPatient.jenis === '1' || selectedPatient.jenis === 1) ? 'Laki-laki' : 'Perempuan'}, {dayjs().diff(dayjs(selectedPatient.tgl_lahir), 'year')} tahun
                    </span>
                  </div>
                </div>
              </div>

              {/* Address Info */}
              <div className="flex-1 flex items-center px-6 py-4 bg-white/50 backdrop-blur-sm border-r border-white/30">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                    <HomeOutlined className="text-white text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-1">Alamat Lengkap</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-gray-600 italic truncate">{selectedPatient.alamat || 'Tidak tersedia'}</p>
                      {(selectedPatient.kel || selectedPatient.kec || selectedPatient.kab) && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {selectedPatient.kel && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Kel. {selectedPatient.kel}</span>}
                          {selectedPatient.kec && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Kec. {selectedPatient.kec}</span>}
                          {selectedPatient.kab && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Kab. {selectedPatient.kab}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="flex items-center px-6 py-4 bg-white/70 backdrop-blur-sm border-r border-white/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                    {selectedPatient.nama_dokter?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{selectedPatient.nama_dokter || 'Belum ditentukan'}</p>
                    <p className="text-xs text-orange-600 font-medium">Dokter Penanggung Jawab</p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center px-6 py-4 bg-white/70 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    ACTIVE
                  </div>
                  <p className="text-xs text-gray-500">Status Pasien</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Tabs (ERM Process) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm h-[calc(100vh-270px)] overflow-y-auto custom-scrollbar">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                if (key === '3' && !isSoapUnlocked) {
                  showSoapConfirmation(key);
                } else {
                  setActiveTab(key);
                }
              }}
              destroyOnHidden={false}
              items={[
                {
                  key: '1',
                  label: <span><UserOutlined /> Data Pasien</span>,
                  children: (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                          <h4 className="text-indigo-900 font-semibold mb-2">KT/V (Adekuasi Dialisis)</h4>
                          <div className="flex items-center gap-4">
                            <h2 className="text-3xl font-bold text-indigo-700">{cpptData[0]?.kt_v || '0.0'}</h2>
                            <div className="flex-1 h-3 bg-white rounded-full overflow-hidden border border-indigo-100">
                              <div className="h-full bg-green-500" style={{ width: `${Math.min((parseFloat(cpptData[0]?.kt_v || 0) / 1.2) * 100, 100)}%` }}></div>
                            </div>
                            <Tag color={parseFloat(cpptData[0]?.kt_v || 0) >= 1.2 ? "success" : "warning"}>
                              {parseFloat(cpptData[0]?.kt_v || 0) >= 1.2 ? "TARGET CAPAI" : "BELUM TARGET"}
                            </Tag>
                          </div>
                          <p className="text-[10px] text-indigo-400 mt-2">*Berdasarkan rumus Daugirdas II (Target &gt; 1.2)</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                          <h4 className="text-orange-900 font-semibold mb-2">Ulor / Penarikan Cairan</h4>
                          <div className="flex items-center gap-4">
                            <h2 className="text-3xl font-bold text-orange-700">{cpptData[0]?.ulor || '0.0'}<span className="text-sm font-normal">L</span></h2>
                            <div className="text-xs text-orange-600">BB Pre: {cpptData[0]?.bb_pre_hd || '-'}kg <br /> BB Post: {cpptData[0]?.bb || '-'}kg</div>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <HistoryOutlined /> Riwayat Tindakan Terakhir
                      </h3>
                      <Table size="small" pagination={false}
                        rowKey="ass_no"
                        dataSource={cpptData.filter(c => c.soap_jns === '1' || c.nama_profesi?.toLowerCase().includes('dokter')).slice(0, 2)}
                        columns={[
                          { title: 'Tanggal', dataIndex: 'tgl_periksa', render: (t) => dayjs(t).format('DD MMM YYYY') },
                          { title: 'Asesmen (Diagnosa)', dataIndex: 'assesment' },
                          { title: 'Plan (Tindakan)', dataIndex: 'plan' }
                        ]} />
                    </div>
                  ),
                },
                {
                  key: '2',
                  label: <span><MedicineBoxOutlined /> CPPT</span>,
                  children: (
                    <div className="space-y-4">
                      <Table
                        dataSource={isDokter ? cpptData.filter(r => r.soap_jns === '1' || r.soap_jns === 1) : cpptData}
                        rowKey="ass_no"
                        size="small"
                        scroll={{ x: 1200 }}
                        columns={[
                          {
                            title: 'Tanggal / Jam - PPA',
                            dataIndex: 'nama_profesi',
                            width: 200,
                            render: (profesi, record) => {
                              const getProfesiName = (code) => {
                                if (!code) return '-';
                                // Jika sudah berupa nama profesi langsung, tampilkan apa adanya
                                if (typeof code === 'string' && isNaN(code)) {
                                  return code;
                                }
                                // Jika berupa kode angka, mapping ke nama profesi
                                switch (code) {
                                  case '1': case 1: return 'Dokter';
                                  case '2': case 2: return 'Perawat';
                                  case '3': case 3: return 'Bidan';
                                  default: return code || '-';
                                }
                              };
                              return (
                                <div className="text-center">
                                  <div className="font-semibold text-slate-900">{dayjs(record.tgl_periksa).format('DD/MM/YYYY')}</div>
                                  <div className="text-xs text-slate-500">{dayjs(record.tgl_periksa).format('HH:mm')}</div>
                                  <div className="text-xs text-slate-500 mt-1">{record.nama_petugas || '-'}</div>
                                  <div className="text-xs text-slate-600 mt-1 font-medium">{getProfesiName(profesi)}</div>
                                </div>
                              );
                            }
                          },
                          {
                            title: 'Hasil Pemeriksaan',
                            dataIndex: 'subjektif',
                            width: 360,
                            render: (_, record) => (
                              <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                  <Tag color="blue" size="small" className="text-[10px]">S</Tag>
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900 whitespace-pre-wrap">{record.subjektif || '-'}</div>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Tag color="green" size="small" className="text-[10px]">O</Tag>
                                  <div className="space-y-2">
                                    <div className="text-sm font-semibold text-slate-900 whitespace-pre-wrap">{record.objektif || '-'}</div>
                                    {record.kd_ruang && <div className="text-xs text-slate-500 uppercase">{record.kd_ruang}</div>}
                                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                                      {record.tensi && <div className="rounded-xl bg-slate-100 px-2 py-1">Tensi: {record.tensi}</div>}
                                      {record.nadi && <div className="rounded-xl bg-slate-100 px-2 py-1">Nadi: {record.nadi}</div>}
                                      {record.suhu && <div className="rounded-xl bg-slate-100 px-2 py-1">Suhu: {record.suhu}</div>}
                                      {record.rr && <div className="rounded-xl bg-slate-100 px-2 py-1">RR: {record.rr}</div>}
                                      {record.spo2 && <div className="rounded-xl bg-slate-100 px-2 py-1">SpO₂: {record.spo2}</div>}
                                      {record.lk && <div className="rounded-xl bg-slate-100 px-2 py-1">LK: {record.lk}</div>}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {record.tensi && <span className="rounded-full bg-red-50 text-red-700 px-2 py-1 text-[11px] font-semibold">{record.tensi}</span>}
                                  {record.nadi && <span className="rounded-full bg-violet-50 text-violet-700 px-2 py-1 text-[11px] font-semibold">{record.nadi}</span>}
                                  {record.suhu && <span className="rounded-full bg-amber-50 text-amber-700 px-2 py-1 text-[11px] font-semibold">T {record.suhu}</span>}
                                </div>
                              </div>
                            )
                          },
                          {
                            title: 'Analisa Pemeriksaan',
                            dataIndex: 'assesment',
                            width: 260,
                            render: (text) => (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Tag color="orange" size="small" className="text-[10px]">A</Tag>
                                  <span className="text-sm font-medium whitespace-pre-wrap">{text || '-'}</span>
                                </div>
                              </div>
                            )
                          },
                          {
                            title: 'Rencana Penatalaksanaan / Instruksi PP',
                            dataIndex: 'plan',
                            width: 360,
                            render: (text) => (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Tag color="purple" size="small" className="text-[10px]">P</Tag>
                                  <span className="text-sm font-medium whitespace-pre-wrap">{text || '-'}</span>
                                </div>
                              </div>
                            )
                          },
                          {
                            title: 'Keterangan',
                            dataIndex: 'soap_tipe',
                            width: 150,
                            render: (soapTipe) => {
                              const getSoapType = (type) => {
                                switch (String(type)) {
                                  case '1': return { label: 'SOAP', color: 'blue' };
                                  case '2': return { label: 'TBAK', color: 'purple' };
                                  case '3': return { label: 'Hand Over', color: 'orange' };
                                  case '4': return { label: 'ADIME', color: 'green' };
                                  default: return { label: type || '-', color: 'gray' };
                                }
                              };
                              const soapType = getSoapType(soapTipe);
                              return (
                                <Tag color={soapType.color} className="font-medium">
                                  {soapType.label}
                                </Tag>
                              );
                            }
                          },
                          {
                            title: 'Aksi',
                            dataIndex: 'ass_no',
                            width: 150,
                            align: 'center',
                            fixed: 'right',
                            render: (_, record) => {
                              const hasIE = record.implementation?.trim() || record.evaluation?.trim();
                              return (
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    type="link"
                                    size="small"
                                    icon={<EyeOutlined />}
                                    className="text-blue-600 hover:text-blue-800"
                                    onClick={() => {
                                      Modal.info({
                                        title: 'Detail CPPT',
                                        width: 800,
                                        content: (
                                          <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                              <div><strong>Tanggal:</strong> {dayjs(record.tgl_periksa).format('DD/MM/YYYY HH:mm')}</div>
                                              <div><strong>PPA:</strong> {
                                                (() => {
                                                  const getProfesiName = (code) => {
                                                    if (!code) return '-';
                                                    if (typeof code === 'string' && isNaN(code)) {
                                                      return code;
                                                    }
                                                    switch (code) {
                                                      case '1': case 1: return 'Dokter';
                                                      case '2': case 2: return 'Perawat';
                                                      case '3': case 3: return 'Bidan';
                                                      default: return code || '-';
                                                    }
                                                  };
                                                  return getProfesiName(record.nama_profesi);
                                                })()
                                              }</div>
                                              <div><strong>Nama Petugas:</strong> {record.nama_petugas || '-'}</div>
                                              <div><strong>Ruang:</strong> {record.klinik_name || '-'}</div>
                                              <div><strong>Jenis:</strong> {record.soap_jns || 'SOAP'}</div>
                                            </div>

                                            <div className="space-y-3">
                                              <div>
                                                <h4 className="font-semibold text-gray-800 mb-2">Subjektif</h4>
                                                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded whitespace-pre-wrap">{record.subjektif || '-'}</p>
                                              </div>
                                              <div>
                                                <h4 className="font-semibold text-gray-800 mb-2">Objektif</h4>
                                                <p className="text-sm text-gray-600 bg-green-50 p-3 rounded whitespace-pre-wrap">{record.objektif || '-'}</p>
                                              </div>
                                              <div>
                                                <h4 className="font-semibold text-gray-800 mb-2">Assessment</h4>
                                                <p className="text-sm text-gray-600 bg-orange-50 p-3 rounded whitespace-pre-wrap">{record.assesment || '-'}</p>
                                              </div>
                                              <div>
                                                <h4 className="font-semibold text-gray-800 mb-2">Plan</h4>
                                                <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded whitespace-pre-wrap">{record.plan || '-'}</p>
                                              </div>
                                              {record.implementation && (
                                                <div>
                                                  <h4 className="font-semibold text-gray-800 mb-2">Implementation</h4>
                                                  <p className="text-sm text-gray-600 bg-indigo-50 p-3 rounded whitespace-pre-wrap">{record.implementation}</p>
                                                </div>
                                              )}
                                              {record.evaluation && (
                                                <div>
                                                  <h4 className="font-semibold text-gray-800 mb-2">Evaluation</h4>
                                                  <p className="text-sm text-gray-600 bg-pink-50 p-3 rounded whitespace-pre-wrap">{record.evaluation}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ),
                                        okText: 'Tutup'
                                      });
                                    }}
                                  >
                                    Detail
                                  </Button>
                                </div>
                              );
                            }
                          }
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: '3',
                  label: <span><FileTextOutlined /> SOAP</span>,
                  disabled: !isSoapUnlocked,
                  children: (() => {
                    const soapHistory = cpptData
                      .filter(r => !currentPPA || r.soap_jns === currentPPA.kd_profesi)
                      .slice(0, 2);

                    const templateBtn = (tipe, color) => (
                      <Button
                        size="small" type="link"
                        className={`p-0 h-auto text-${color}-600`}
                        icon={<UnorderedListOutlined />}
                        onClick={() => openTemplateModal(tipe)}
                      >Template</Button>
                    );

                    return (
                      <div className="space-y-4">
                        <Form form={form} layout="vertical" onFinish={onFinishSoap} autoComplete="off">

                          {/* Date of Examination */}
                          <div className="flex justify-end mb-4">
                            <Form.Item 
                              label={<span className="text-[11px] font-bold text-gray-500 uppercase">Tanggal & Jam Periksa</span>} 
                              name="tgl_periksa" 
                              className="mb-0"
                              initialValue={dayjs()}
                            >
                              <DatePicker showTime format="DD/MM/YYYY HH:mm" size="small" className="rounded-lg border-indigo-200" />
                            </Form.Item>
                          </div>

                          {/* ── Tanda Vital & Data HD ── */}
                          {isDokter && (
                            <div className="flex justify-between items-center bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 mb-3">
                              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Tanda Vital (TTV) {!showTTV && '& Laporan HD'}</span>
                              <Button
                                size="small"
                                type={showTTV ? "default" : "primary"}
                                icon={showTTV ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                onClick={() => setShowTTV(!showTTV)}
                                className="rounded-full text-[10px]"
                              >
                                {showTTV ? 'Sembunyikan' : 'Tampilkan Isian TTV'}
                              </Button>
                            </div>
                          )}

                          <div className={`bg-gray-50 p-4 rounded-xl border border-gray-200 mb-2 transition-all duration-300 ${!showTTV ? 'opacity-0 h-0 overflow-hidden m-0 p-0 border-none' : 'opacity-100'}`}>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tanda Vital &amp; Data HD</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-0 text-[11px]">
                              <Form.Item label="Suhu" name="suhu" className="mb-2"><Input id="vs_suhu" placeholder="..." onKeyDown={(e) => handleNextFocus(e, 'vs_nadi')} onBlur={updateObjectiveWithVitals} /></Form.Item>
                              <Form.Item label="Nadi" name="nadi" className="mb-2"><Input id="vs_nadi" placeholder="..." onKeyDown={(e) => handleNextFocus(e, 'vs_tensi')} onBlur={updateObjectiveWithVitals} /></Form.Item>
                              <Form.Item label="Tensi" name="tensi" className="mb-2"><Input id="vs_tensi" placeholder="..." onKeyDown={(e) => handleNextFocus(e, 'vs_rr')} onBlur={updateObjectiveWithVitals} /></Form.Item>
                              <Form.Item label="RR" name="rr" className="mb-2"><Input id="vs_rr" placeholder="..." onKeyDown={(e) => handleNextFocus(e, 'vs_spo2')} onBlur={updateObjectiveWithVitals} /></Form.Item>
                              <Form.Item label="SPO2" name="spo2" className="mb-2"><Input id="vs_spo2" placeholder="..." onKeyDown={(e) => handleNextFocus(e, 'vs_bb_pre')} onBlur={updateObjectiveWithVitals} /></Form.Item>
                              <Form.Item label="BB Pre" name="bb_pre_hd" className="mb-2"><Input id="vs_bb_pre" placeholder="..." onKeyDown={(e) => handleNextFocus(e, 'vs_tb')} onBlur={updateObjectiveWithVitals} /></Form.Item>
                              <Form.Item label="TB" name="tb" className="mb-2"><Input id="vs_tb" placeholder="..." onKeyDown={(e) => handleNextFocus(e, 'vs_ulor')} onBlur={updateObjectiveWithVitals} /></Form.Item>
                              <Form.Item label="Ulor (L)" name="ulor" className="mb-2"><Input id="vs_ulor" placeholder="..." onKeyDown={(e) => handleNextFocus(e, 'vs_adekuasi')} onBlur={updateObjectiveWithVitals} /></Form.Item>
                              <Form.Item label="Adekuasi" name="adekuasi_cairan" className="mb-2">
                                <Input id="vs_adekuasi" disabled placeholder="..." onKeyDown={(e) => handleNextFocus(e, 'vs_ktv_k')} onBlur={updateObjectiveWithVitals} />
                              </Form.Item>
                            </div>
                            <div className="mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 italic">
                              <div className="flex gap-4 items-end flex-wrap">
                                <div className="text-blue-800 font-bold not-italic font-xs uppercase tracking-wider">Penjabaran KT/V: </div>
                                <Form.Item label="K (Clearance)" name="ktv_k" className="mb-0">
                                  <Input id="vs_ktv_k" size="small" style={{ width: 80 }} placeholder="K" onKeyDown={(e) => handleNextFocus(e, 'vs_ktv_t')} />
                                </Form.Item>
                                <div className="mb-1 text-gray-400">×</div>
                                <Form.Item label="t (Time)" name="ktv_t" className="mb-0">
                                  <Input id="vs_ktv_t" size="small" style={{ width: 80 }} placeholder="t" onKeyDown={(e) => handleNextFocus(e, 'vs_ktv_v')} />
                                </Form.Item>
                                <div className="mb-1 text-gray-400">÷</div>
                                <Form.Item label="V (Volume)" name="ktv_v" className="mb-0">
                                  <Input id="vs_ktv_v" size="small" style={{ width: 80 }} placeholder="V" onKeyDown={(e) => handleNextFocus(e, 'vs_kt_v')} />
                                </Form.Item>
                                <div className="mb-1 text-gray-400">=</div>
                                <Form.Item label="Hasil KT/V" name="kt_v" className="mb-0">
                                  <Input id="vs_kt_v" size="small" style={{ width: 80 }} className="font-bold text-blue-700" placeholder="..." onKeyDown={(e) => handleNextFocus(e, 'vs_bb_kering')} onBlur={updateObjectiveWithVitals} />
                                </Form.Item>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-0">
                              <Form.Item label="BB Kering (kg)" name="bb_kering" className="mb-2"><Input id="vs_bb_kering" placeholder="60" onKeyDown={(e) => handleNextFocus(e, 'vs_bb_post_prev')} onBlur={updateObjectiveWithVitals} /></Form.Item>
                              <Form.Item label="BB Post HD Sblmnya" name="bb_post_hd_sblmnya" className="mb-2">
                                <Input id="vs_bb_post_prev" placeholder="62" onKeyDown={(e) => handleNextFocus(e, 'vs_hd_ke')} onBlur={updateObjectiveWithVitals} />
                              </Form.Item>
                              <Form.Item label="Tindakan HD Ke" name="tindakan_hd_ke" className="mb-2">
                                <Input id="vs_hd_ke" placeholder="1" onKeyDown={(e) => handleNextFocus(e, 'vs_egfr')} onBlur={updateObjectiveWithVitals} />
                              </Form.Item>
                              <Form.Item label="eGFR (mL/min/1.73m²)" name="egfr" className="mb-2">
                                <Input id="vs_egfr" placeholder="12.5" onBlur={updateObjectiveWithVitals} />
                              </Form.Item>
                              <Form.Item label="Akses Vaskuler" name="akses_vaskuler" className="mb-2">
                                <Select placeholder="Pilih..." allowClear onChange={updateObjectiveWithVitals} options={[
                                  { value: 'AVF', label: 'AVF' },
                                  { value: 'AVG', label: 'AVG (Graft)' },
                                  { value: 'CVC Temporer', label: 'CVC Temporer' },
                                  { value: 'CVC Permanen', label: 'CVC Permanen' },
                                ]} />
                              </Form.Item>
                              <Form.Item label="Tanda Infeksi" name="tanda_infeksi" className="mb-2">
                                <Select placeholder="Pilih..." allowClear onChange={updateObjectiveWithVitals} options={[
                                  { value: 'Tidak Ada', label: 'Tidak Ada' },
                                  { value: 'Kemerahan', label: 'Ada — Kemerahan' },
                                  { value: 'Bengkak', label: 'Ada — Bengkak' },
                                  { value: 'Discharge', label: 'Ada — Discharge' },
                                  { value: 'Nyeri Tekan', label: 'Ada — Nyeri Tekan' },
                                ]} />
                              </Form.Item>
                            </div>
                          </div>

                          {/* ── SOAP 2×2 ── */}
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-xs text-gray-400 italic">Silahkan isi catatan SOAP di bawah ini</div>
                            {(currentPPA?.kd_profesi === '1' || currentPPA?.kd_profesi === 1 || (currentPPA?.nama_profesi && currentPPA.nama_profesi.toLowerCase().includes('dokter'))) && (
                              <Button
                                size="small"
                                type="primary"
                                ghost
                                icon={<CopyOutlined />}
                                onClick={handleGetSoapPerawat}
                                className="mb-1"
                              >Get SOAP Perawat</Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item
                              label={<div className="flex items-center gap-2"><span className="font-bold text-blue-700">Subjektif (S)</span>{templateBtn('S', 'blue')}</div>}
                              name="subjektif" rules={[{ required: true, message: 'Subjektif wajib diisi' }]} className="mb-0"
                            >
                              <Input.TextArea rows={5} placeholder="Keluhan yang dirasakan pasien..." />
                            </Form.Item>
                            <Form.Item
                              label={<div className="flex items-center gap-2"><span className="font-bold text-green-700">Objektif (O)</span>{templateBtn('O', 'green')}</div>}
                              name="objektif" className="mb-0"
                            >
                              <Input.TextArea rows={5} placeholder="Hasil pemeriksaan fisik, observasi..." />
                            </Form.Item>
                            <Form.Item
                              label={
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-orange-700">Asesmen (A)</span>
                                  {templateBtn('A', 'orange')}
                                  {currentPPA && (String(currentPPA.kd_profesi) === '2' || String(currentPPA.nama_profesi).toLowerCase().includes('perawat')) && (
                                    <Checkbox 
                                      checked={isSdkiMode} 
                                      onChange={e => setIsSdkiMode(e.target.checked)}
                                      className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 ml-1"
                                    >Mode SDKI</Checkbox>
                                  )}
                                </div>
                              }
                              name="assesment" className="mb-0"
                            >
                              <Input.TextArea rows={5} placeholder="Analisa / diagnosa keperawatan..." />
                            </Form.Item>
                            <Form.Item
                              label={<div className="flex items-center gap-2"><span className="font-bold text-purple-700">Plan (P)</span>{templateBtn('P', 'purple')}</div>}
                              name="plan" className="mb-0"
                            >
                              <Input.TextArea rows={5} placeholder="Rencana tindakan / instruksi..." />
                            </Form.Item>
                          </div>

                          <Button type="primary" htmlType="submit" loading={loading} className="rounded-lg h-10 px-8">
                            Simpan SOAP
                          </Button>
                        </Form>

                        {/* ── 2 Data SOAP Terakhir ── */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-600 text-sm">
                              Data SOAP — 2 Terakhir {currentPPA ? `(${currentPPA.nama_profesi})` : ''}
                            </span>
                            <Button
                              icon={<CopyOutlined />}
                              size="small"
                              disabled={soapHistory.length === 0}
                              onClick={() => {
                                setCopySOAPSource(soapHistory[0] ?? null);
                                setCopySOAPParts(['S', 'O', 'A', 'P']);
                                setCopySOAPVisible(true);
                              }}
                            >
                              Copy SOAP
                            </Button>
                          </div>
                          <Table
                            size="small" rowKey="ass_no" pagination={false} scroll={{ x: 900 }}
                            dataSource={soapHistory}
                            rowClassName={r => r.ass_no === copySOAPSource?.ass_no ? 'bg-blue-50' : ''}
                            columns={[
                              { title: 'Tanggal', dataIndex: 'tgl_periksa', width: 110, render: v => dayjs(v).format('DD/MM/YY HH:mm') },
                              { title: 'Subjektif', dataIndex: 'subjektif', width: 180, render: v => <span className="text-xs whitespace-pre-wrap">{v || '-'}</span> },
                              { title: 'Objektif', dataIndex: 'objektif', width: 180, render: v => <span className="text-xs whitespace-pre-wrap">{v || '-'}</span> },
                              { title: 'Asesmen', dataIndex: 'assesment', width: 180, render: v => <span className="text-xs whitespace-pre-wrap">{v || '-'}</span> },
                              { title: 'Plan', dataIndex: 'plan', width: 180, render: v => <span className="text-xs whitespace-pre-wrap">{v || '-'}</span> },
                              {
                                title: 'Pelaksana', dataIndex: 'nama_petugas', width: 120,
                                render: (v, r) => <div className="text-xs"><div className="font-medium">{v || '-'}</div><div className="text-gray-400">{r.nama_profesi || '-'}</div></div>,
                              },
                              {
                                title: 'Opsi',
                                key: 'action',
                                width: 100,
                                fixed: 'right',
                                render: (_, record) => {
                                  const isToday = dayjs(record.tgl_periksa).isSame(dayjs(), 'day');
                                  const hasIE = record.implementation?.trim() || record.evaluation?.trim();

                                  return (
                                    <div className="flex flex-wrap gap-2">
                                      {isToday && (
                                        <>
                                          <Button
                                            size="small"
                                            type="primary"
                                            ghost
                                            icon={<EditOutlined />}
                                            onClick={() => handleEditSoap(record)}
                                            className="p-1 h-auto"
                                          />
                                          <Button
                                            size="small"
                                            danger
                                            ghost
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleDeleteSoap(record.ass_no)}
                                            className="p-1 h-auto"
                                          />
                                        </>
                                      )}
                                      <Button
                                        size="small"
                                        type={hasIE ? 'primary' : 'default'}
                                        ghost={!!hasIE}
                                        icon={<EditOutlined />}
                                        className={`text-[10px] h-6 px-1 ${hasIE ? 'border-green-500 text-green-600' : ''}`}
                                        onClick={() => handleCpptDetail(record)}
                                      >
                                        I/E {hasIE && '✓'}
                                      </Button>
                                    </div>
                                  );
                                }
                              }
                            ]}
                          />
                        </div>
                        {editingSoap && (
                          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex justify-between items-center animate-pulse">
                            <div className="text-sm text-orange-800">
                              <EditOutlined className="mr-2" />
                              Sedang mengedit SOAP tanggal <strong>{dayjs(editingSoap.tgl_periksa).format('DD/MM/YY HH:mm')}</strong>
                            </div>
                            <Button size="small" onClick={() => { setEditingSoap(null); form.resetFields(); }}>Batal Edit</Button>
                          </div>
                        )}
                      </div>
                    );
                  })(),
                },
                {
                  key: '2a',
                  label: <span><FileTextOutlined /> Asesmen Awal</span>,
                  children: (
                    <div className="space-y-4">
                      <div className="block">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <Form form={assAwalForm} layout="vertical" onFinish={onFinishAssAwal}>
                            <Form.Item label="Waktu" name="tgl_periksa" className="mb-2"><TimePicker format="HH:mm:ss" /></Form.Item>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="space-y-4">
                                {/* Box 1 */}
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <div className="grid grid-cols-2 gap-4">
                                    <Form.Item label="Cara Asesmen" name="jns_info" className="mb-0">
                                      <Radio.Group>
                                        <Radio value="1">Auto Anamnesis</Radio>
                                        <Radio value="2">Alloanamnesis</Radio>
                                      </Radio.Group>
                                    </Form.Item>
                                    <Form.Item label="Nama (Alloanamnesis)" name="info_ket" className="mb-0"><Input /></Form.Item>
                                  </div>
                                  <div className="mt-2 grid grid-cols-2 gap-4">
                                    <Form.Item label="Riwayat Alergi" name="riw_alergi" className="mb-0">
                                      <Radio.Group>
                                        <Radio value="0">Tidak</Radio>
                                        <Radio value="1">Ya</Radio>
                                      </Radio.Group>
                                    </Form.Item>
                                    <Form.Item label="Ket Alergi" name="ket_alergi" className="mb-0"><Input /></Form.Item>
                                  </div>
                                  <div className="mt-2">
                                    <Form.Item label="Akses Vaskular" name="aks_vaskuler" className="mb-0">
                                      <Radio.Group>
                                        <Radio value="1">AV Shunt</Radio>
                                        <Radio value="2">DL (Subclav/Jugularis)</Radio>
                                        <Radio value="3">Femolaris</Radio>
                                      </Radio.Group>
                                    </Form.Item>
                                  </div>
                                </div>

                                {/* Box 2 Pasien Anak */}
                                {dayjs().diff(dayjs(selectedPatient?.tgl_lahir), 'year') < 18 && (
                                  <div className="bg-white p-3 rounded border border-gray-200 text-xs">
                                    <p className="font-semibold text-gray-700 border-b pb-1 mb-2">Pemeriksaan Pasien Anak</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Form.Item label="Kelahiran" name="riw_partus" className="mb-0">
                                        <Radio.Group><Radio value="1">Spontan</Radio><Radio value="2">Operasi</Radio></Radio.Group>
                                      </Form.Item>
                                      <Form.Item label="Lama Hamil" name="lama_hamil" className="mb-0">
                                        <Radio.Group><Radio value="1">Cukup</Radio><Radio value="2">Kurang</Radio></Radio.Group>
                                      </Form.Item>
                                      <Form.Item label="BB Lahir (gr)" name="bb_lahir" className="mb-0"><Input type="number" /></Form.Item>
                                      <Form.Item label="Pj Lahir (cm)" name="p_lahir" className="mb-0"><Input type="number" /></Form.Item>
                                    </div>
                                    <div className="mt-2 grid grid-cols-4 gap-2">
                                      <Form.Item name="bcg" valuePropName="checked" className="mb-0"><Checkbox>BCG</Checkbox></Form.Item>
                                      <Form.Item name="hepa" valuePropName="checked" className="mb-0"><Checkbox>Hepatitis</Checkbox></Form.Item>
                                      <Form.Item name="dpt" valuePropName="checked" className="mb-0"><Checkbox>DPT</Checkbox></Form.Item>
                                      <Form.Item name="polio" valuePropName="checked" className="mb-0"><Checkbox>Polio</Checkbox></Form.Item>
                                      <Form.Item name="campak" valuePropName="checked" className="mb-0"><Checkbox>Campak</Checkbox></Form.Item>
                                    </div>
                                  </div>
                                )}

                                {/* Box 3 Asesmen Nyeri &Resiko Jatuh */}
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="font-semibold text-gray-700 border-b pb-1 mb-2"> Assesmen Nyeri & Resiko Jatuh</p>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <Form.Item label="Merokok" name="rokok" className="mb-0"><Radio.Group><Radio value="0">Tidak</Radio><Radio value="1">Ya</Radio></Radio.Group></Form.Item>
                                    <Form.Item label="Alkohol" name="alkohol" className="mb-0"><Radio.Group><Radio value="0">Tidak</Radio><Radio value="1">Ya</Radio></Radio.Group></Form.Item>
                                    <Form.Item label="Asesmen Nyeri" name="riw_nyeri" className="mb-0">
                                      <Radio.Group onChange={(e) => {
                                        // Optional side effect if needed
                                      }}>
                                        <Radio value="0">Tidak</Radio>
                                        <Radio value="1">Ya</Radio>
                                      </Radio.Group>
                                    </Form.Item>
                                    <Form.Item label="Skor Nyeri" name="skor_nyeri" className="mb-0"><Input type="number" /></Form.Item>
                                  </div>

                                  <Form.Item noStyle dependencies={['riw_nyeri']}>
                                    {({ getFieldValue }) => getFieldValue('riw_nyeri') === '1' && (
                                      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100 space-y-3 text-[11px]">
                                        <p className="font-bold text-red-800 border-b border-red-200 pb-1 mb-2">Asesmen PQRST</p>
                                        <div className="space-y-3">
                                          {/* P & Q */}
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Form.Item label="- P (Penyebab)" name="p_nyeri" className="mb-1">
                                                <Radio.Group className="flex flex-wrap gap-2">
                                                  <Radio value="1">Gerakan</Radio>
                                                  <Radio value="2">Suara</Radio>
                                                  <Radio value="3">Suara/Tekan</Radio>
                                                  <Radio value="4">Lainnya</Radio>
                                                </Radio.Group>
                                              </Form.Item>
                                              <Form.Item noStyle dependencies={['p_nyeri']}>
                                                {({ getFieldValue }) => getFieldValue('p_nyeri') === '4' && (
                                                  <Form.Item name="p_ket" className="mb-0">
                                                    <Input placeholder="Keterangan P..." size="small" />
                                                  </Form.Item>
                                                )}
                                              </Form.Item>
                                            </div>
                                            <div className="space-y-2">
                                              <Form.Item label="- Q (Kualitas)" name="q_nyeri" className="mb-1">
                                                <Radio.Group className="flex flex-wrap gap-2">
                                                  <Radio value="1">Tajam</Radio>
                                                  <Radio value="2">Ditusuk</Radio>
                                                  <Radio value="3">Dipukul</Radio>
                                                  <Radio value="4">Dibakar</Radio>
                                                  <Radio value="5">Kram</Radio>
                                                  <Radio value="6">Berdenyut</Radio>
                                                  <Radio value="7">Lain</Radio>
                                                </Radio.Group>
                                              </Form.Item>
                                              <Form.Item noStyle dependencies={['q_nyeri']}>
                                                {({ getFieldValue }) => getFieldValue('q_nyeri') === '7' && (
                                                  <Form.Item name="q_ket" className="mb-0">
                                                    <Input placeholder="Keterangan Q..." size="small" />
                                                  </Form.Item>
                                                )}
                                              </Form.Item>
                                            </div>
                                          </div>

                                          {/* R & S */}
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="grid grid-cols-2 gap-2">
                                              <Form.Item label="- R (Tempat)" name="r_nyeri" className="mb-1">
                                                <Radio.Group>
                                                  <Radio value="0">Tidak</Radio>
                                                  <Radio value="1">Ya</Radio>
                                                </Radio.Group>
                                              </Form.Item>
                                              <Form.Item label="Lokasi" name="r_ket" className="mb-0">
                                                <Input placeholder="Dimana..." size="small" />
                                              </Form.Item>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                              <Form.Item label="- S (Skala)" name="s_nyeri" className="mb-1">
                                                <Radio.Group>
                                                  <Radio value="1">Ringan</Radio>
                                                  <Radio value="2">Sedang</Radio>
                                                  <Radio value="3">Berat</Radio>
                                                </Radio.Group>
                                              </Form.Item>
                                              <Form.Item label="Ganggu Aktifitas?" name="s_ket" className="mb-0">
                                                <Radio.Group size="small">
                                                  <Radio value="1">Ya</Radio>
                                                  <Radio value="0">Tidak</Radio>
                                                </Radio.Group>
                                              </Form.Item>
                                            </div>
                                          </div>

                                          {/* T */}
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Form.Item label="- T (Waktu)" name="t_nyeri" className="mb-0">
                                              <Radio.Group className="flex flex-wrap gap-2">
                                                <Radio value="1">Bertahap</Radio>
                                                <Radio value="2">Tiba-tiba</Radio>
                                                <Radio value="3">Sering</Radio>
                                                <Radio value="4">Jarang</Radio>
                                              </Radio.Group>
                                            </Form.Item>
                                            <Form.Item label="Kapan" name="t_waktu" className="mb-0">
                                              <Input placeholder="Waktu kejadian..." size="small" />
                                            </Form.Item>
                                            <Form.Item label="Lamanya" name="t_lama" className="mb-0">
                                              <Input placeholder="Durasi..." size="small" />
                                            </Form.Item>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Form.Item>
                                  <div className="mt-2 text-xs">
                                    <Form.Item label="Pasien tampak tdk seimbang saat duduk?" name="rjatuh_seimbang" className="mb-0">
                                      <Radio.Group><Radio value="0">Tidak</Radio><Radio value="1">Ya</Radio></Radio.Group>
                                    </Form.Item>
                                    <Form.Item label="Pasien memegang pinggiran sbg penopang?" name="rjatuh_penopang" className="mb-0 mt-1">
                                      <Radio.Group><Radio value="0">Tidak</Radio><Radio value="1">Ya</Radio></Radio.Group>
                                    </Form.Item>
                                  </div>
                                </div>

                                {/* Box 4 Vital & Psikologi */}
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <div className="grid grid-cols-3 gap-2">
                                    <Form.Item label="Tensi" name="tensi" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="Nadi" name="nadi" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="Suhu" name="suhu" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="RR" name="rr" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="TB" name="tb" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="BB" name="bb" className="mb-0"><Input /></Form.Item>
                                  </div>
                                  <div className="mt-2 text-xs">
                                    <Form.Item label="Psikologis Pasien" name="psi_kondisi" className="mb-0">
                                      <Radio.Group><Radio value="1">Baik</Radio><Radio value="2">Cemas</Radio><Radio value="3">Depresi</Radio></Radio.Group>
                                    </Form.Item>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                {/* Box 5 Fisik & Diagnosa */}
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <Form.Item label="Keluhan Utama" name="keluhan" className="mb-2"><Input.TextArea rows={1} /></Form.Item>
                                  <Form.Item label="Riwayat Penyakit" name="riw_penyakit" className="mb-2"><Input.TextArea rows={1} /></Form.Item>

                                  <p className="font-semibold text-gray-700 mt-2">Pemeriksaan Fisik</p>
                                  <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                                    <Form.Item label="Keadaan Umum" name="keadaan_umum" className="mb-0">
                                      <Radio.Group className="flex flex-col"><Radio value="1">Baik</Radio><Radio value="2">Tampak Sakit</Radio><Radio value="3">Lainnya</Radio></Radio.Group>
                                    </Form.Item>
                                    <Form.Item label="Ket. Lainnya" name="keadaan_ket" className="mb-0"><Input /></Form.Item>
                                  </div>
                                  <Form.Item label="Status Lokalis" name="status_lokalis" className="mb-2 mt-2"><Input.TextArea rows={2} /></Form.Item>

                                  <div className="grid grid-cols-2 gap-4 mt-2">
                                    <Form.Item label="Hasil Penunjang" name="hsl_penunjang" className="mb-0"><Input.TextArea rows={2} /></Form.Item>
                                    <Form.Item label="Obat Sblmnya" name="obat_sblmnya" className="mb-0"><Input.TextArea rows={2} /></Form.Item>
                                  </div>
                                  <Form.Item label="Diagnosa" name="diag_awal" className="mb-2 mt-2"><Input /></Form.Item>
                                </div>

                                {/* Box 6 Edukasi */}
                                <div className="bg-white p-3 rounded border border-gray-200 text-xs">
                                  <p className="font-semibold text-gray-700 border-b pb-1 mb-2">Edukasi Pasien</p>
                                  <Form.Item label="Telah diinformasikan kpd pasien/keluarga?" name="edu_pasien" className="mb-2">
                                    <Radio.Group><Radio value="1">Ya</Radio><Radio value="0">Tidak</Radio></Radio.Group>
                                  </Form.Item>
                                  <div className="grid grid-cols-3 gap-2">
                                    <Form.Item name="edu_hasil" valuePropName="checked" className="mb-0"><Checkbox>Hasil Pemeriksaan</Checkbox></Form.Item>
                                    <Form.Item name="edu_tindakan" valuePropName="checked" className="mb-0"><Checkbox>Tindakan/Pengobatan</Checkbox></Form.Item>
                                    <Form.Item name="edu_komplikasi" valuePropName="checked" className="mb-0"><Checkbox>Komplikasi Yg Mungkin</Checkbox></Form.Item>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <Button type="primary" htmlType="submit" loading={loading} className="px-8 font-semibold rounded-lg bg-green-600 hover:bg-green-700">
                                {editingAssAwal ? 'Simpan Perubahan' : 'Simpan Asesmen Awal'}
                              </Button>
                            </div>
                          </Form>
                        </div>
                      </div>

                    </div>
                  ),
                },
                {
                  key: '4',
                  label: <span><LineChartOutlined /> EWS</span>,
                  children: (
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">Riwayat EWS</h3>
                          <Button
                            type="primary"
                            onClick={() => {
                              setShowEwsForm(!showEwsForm);
                              if (!showEwsForm) {
                                setEditingEws(null);
                                setEwsParameters({
                                  kesadaran: 0,
                                  suhu: 0,
                                  tekanan_sistolik: 0,
                                  denyut_nadi: 0,
                                  respirasi: 0,
                                  saturasi_oksigen: 0,
                                  perdarahan: 0,
                                  intensive: 0
                                });
                              }
                            }}
                            icon={<HistoryOutlined />}
                          >
                            {showEwsForm ? 'Sembunyikan Form' : 'Input Baru'}
                          </Button>
                        </div>
                        <Table
                          dataSource={ewsData}
                          rowKey="id_item"
                          size="small"
                          scroll={{ x: 1200 }}
                          columns={[
                            {
                              title: 'Tanggal / Jam',
                              dataIndex: 'tgl_jam',
                              width: 140,
                              render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
                            },
                            { title: 'Kesadaran', dataIndex: 'kesadaran', render: (s) => <div className="text-xs whitespace-nowrap"><Tag color="blue">{s} ({s == 0 ? 'Alert' : s == 1 ? 'Verbal' : s == 2 ? 'Pain' : s == 3 ? 'Unresponsive' : '-'})</Tag></div> },
                            { title: 'Suhu', dataIndex: 'suhu', render: (s) => <div className="text-xs whitespace-nowrap"><Tag color="orange">{s} ({s == 0 ? '36-38°C' : s == 1 ? '≤35 / ≥38.6°C' : s == 2 ? '35.1-36°C' : s == 3 ? '≥39°C' : '-'})</Tag></div> },
                            { title: 'Tekanan Sist', dataIndex: 'tekanan_darah_sistolik', render: (s) => <div className="text-xs whitespace-nowrap"><Tag color="red">{s} ({s == 0 ? '111-219' : s == 1 ? '≤100 / ≥220' : s == 2 ? '101-110' : s == 3 ? '≤90 / ≥230' : '-'})</Tag></div> },
                            { title: 'Nadi', dataIndex: 'denyut_nadi', render: (s) => <div className="text-xs whitespace-nowrap"><Tag color="violet">{s} ({s == 0 ? '51-100' : s == 1 ? '41-50 / 101-110' : s == 2 ? '111-130' : s == 3 ? '≤40 / ≥131' : '-'})</Tag></div> },
                            { title: 'Respirasi', dataIndex: 'respirasi', render: (s) => <div className="text-xs whitespace-nowrap"><Tag color="green">{s} ({s == 0 ? '12-20' : s == 1 ? '9-11 / 21-24' : s == 2 ? '≤8 / ≥25' : s == 3 ? '-' : '-'})</Tag></div> },
                            { title: 'SpO₂', dataIndex: 'saturasi_oksigen', render: (s) => <div className="text-xs whitespace-nowrap"><Tag color="cyan">{s} ({s == 0 ? '≥95%' : s == 1 ? '94%' : s == 2 ? '92-93%' : s == 3 ? '≤91%' : '-'})</Tag></div> },
                            { title: 'GDS', dataIndex: 'gds', width: 70, render: (v) => v ? <Tag color="purple">{v}</Tag> : '-' },
                            { title: 'Skor Nyeri', dataIndex: 'skor_nyeri', width: 80, render: (v) => v ? <Tag color="magenta">{v}</Tag> : '-' },
                            { title: 'Urine Output', dataIndex: 'urine_output', width: 90, render: (v) => v ? <Tag color="geekblue">{v}</Tag> : '-' },
                            {
                              title: 'Skor',
                              render: (_, record) => {
                                const total = (record.kesadaran || 0) + (record.suhu || 0) + (record.tekanan_darah_sistolik || 0) +
                                  (record.denyut_nadi || 0) + (record.respirasi || 0) + (record.saturasi_oksigen || 0);
                                return <Tag color={total > 4 ? 'red' : total > 2 ? 'orange' : 'green'}>{total}</Tag>;
                              }
                            },
                            {
                              title: 'Kategori',
                              dataIndex: 'kategori',
                              render: (k) => {
                                if (k?.includes('CODE BLUE')) return <Tag color="processing" className="font-bold border-blue-500 text-blue-700 animate-pulse"> {k} </Tag>;
                                if (k?.includes('Sangat Tinggi')) return <Tag color="red" className="font-bold">{k}</Tag>;
                                if (k?.includes('Tinggi')) return <Tag color="volcano">{k}</Tag>;
                                if (k?.includes('Sedang')) return <Tag color="orange">{k}</Tag>;
                                return <Tag color="green">{k}</Tag>;
                              }
                            },
                            {
                              title: 'Aksi',
                              render: (_, record) => (
                                <div className="flex gap-2">
                                  <Button size="small" onClick={() => handleEditEws(record)} icon={<EyeOutlined />}>
                                    Edit
                                  </Button>
                                  <Button size="small" danger onClick={() => handleDeleteEws(record.id_item)}>
                                    Hapus
                                  </Button>
                                </div>
                              )
                            }
                          ]}
                        />
                      </div>

                      <div className={showEwsForm ? 'block' : 'hidden'}>
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                          <h3 className="text-lg font-bold text-blue-900 mb-6">
                            {editingEws ? 'Edit Early Warning System (EWS)' : 'Input Early Warning System (EWS)'}
                          </h3>
                          <Form form={ewsForm} layout="vertical" onFinish={onFinishEws}>
                            <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm mb-4">
                              <label className="block font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                                Tingkat Kesadaran (AVPU)
                              </label>
                              <div className="flex flex-wrap gap-3">
                                {[
                                  { label: 'Sadar (Alert)', score: 0, color: 'indigo' },
                                  { label: 'Nyeri / Verbal', score: 3, color: 'orange' },
                                  { label: 'Unrespon (ARREST)', score: 'BLUE', color: 'blue' }
                                ].map(item => (
                                  <button
                                    key={item.score}
                                    type="button"
                                    onClick={() => setEwsParameters({ ...ewsParameters, kesadaran: item.score })}
                                    className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 flex flex-col items-center gap-1 ${ewsParameters.kesadaran === item.score
                                      ? `bg-${item.color}-600 text-white shadow-xl scale-105 ring-4 ring-${item.color}-100`
                                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                                      }`}
                                  >
                                    <span>{item.label}</span>
                                    <span className={`text-[10px] opacity-70 ${ewsParameters.kesadaran === item.score ? 'text-white' : 'text-gray-400'}`}>
                                      Skor: {item.score}
                                    </span>
                                  </button>
                                ))}
                              </div>
                              <p className="mt-4 text-[11px] text-gray-400 font-medium italic">
                                *Pilih 'Unrespon' jika terjadi henti napas atau henti jantung (Aktivasi Code Blue).
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* SUHU */}
                              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                                <label className="block font-bold text-gray-700 mb-3 flex items-center gap-2">
                                  <div className="w-1.5 h-4 bg-orange-400 rounded-full"></div> Temperatur (°C)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { label: '≤ 35', score: 3 },
                                    { label: '35.1 - 36', score: 1 },
                                    { label: '36.1 - 38', score: 0 },
                                    { label: '38.1 - 39', score: 1 },
                                    { label: '> 39', score: 2 }
                                  ].map(item => (
                                    <button
                                      key={item.label}
                                      type="button"
                                      onClick={() => setEwsParameters({ ...ewsParameters, suhu: item.score })}
                                      className={`px-3 py-2 rounded-xl font-bold text-[11px] transition-all ${ewsParameters.suhu === item.score
                                        ? 'bg-orange-600 text-white shadow-md scale-105'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                      {item.label} ({item.score})
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* TEKANAN SISTOLIK */}
                              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                                <label className="block font-bold text-gray-700 mb-3 flex items-center gap-2">
                                  <div className="w-1.5 h-4 bg-red-400 rounded-full"></div> Tekanan Darah Sistolik (mmHg)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { label: '> 220', score: 3 },
                                    { label: '181 - 220', score: 1 },
                                    { label: '111 - 180', score: 0 },
                                    { label: '101 - 110', score: 1 },
                                    { label: '91 - 100', score: 2 },
                                    { label: '71 - 90', score: 3 },
                                    { label: '≤ 70', score: 'BLUE' }
                                  ].map(item => (
                                    <button
                                      key={item.label}
                                      type="button"
                                      onClick={() => setEwsParameters({ ...ewsParameters, tekanan_sistolik: item.score })}
                                      className={`px-3 py-2 rounded-xl font-bold text-[11px] transition-all ${ewsParameters.tekanan_sistolik === item.score
                                        ? item.score === 'BLUE' ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-red-600 text-white shadow-md scale-105'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                      {item.label} ({item.score})
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* DENYUT JANTUNG */}
                              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                                <label className="block font-bold text-gray-700 mb-3 flex items-center gap-2">
                                  <div className="w-1.5 h-4 bg-rose-500 rounded-full"></div> Denyut Jantung (BPM)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { label: '≥ 141', score: 'BLUE' },
                                    { label: '131 - 140', score: 3 },
                                    { label: '111 - 130', score: 2 },
                                    { label: '91 - 110', score: 1 },
                                    { label: '51 - 90', score: 0 },
                                    { label: '41 - 50', score: 1 },
                                    { label: '≤ 40', score: 'BLUE' }
                                  ].map(item => (
                                    <button
                                      key={item.label}
                                      type="button"
                                      onClick={() => setEwsParameters({ ...ewsParameters, denyut_nadi: item.score })}
                                      className={`px-3 py-2 rounded-xl font-bold text-[11px] transition-all ${ewsParameters.denyut_nadi === item.score
                                        ? item.score === 'BLUE' ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-rose-600 text-white shadow-md scale-105'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                      {item.label} ({item.score})
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* PERNAFASAN */}
                              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                                <label className="block font-bold text-gray-700 mb-3 flex items-center gap-2">
                                  <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div> Pernafasan (x/mnt)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { label: '≤ 5', score: 'BLUE' },
                                    { label: '6 - 8', score: 3 },
                                    { label: '9 - 11', score: 1 },
                                    { label: '12 - 20', score: 0 },
                                    { label: '21 - 24', score: 2 },
                                    { label: '25 - 34', score: 3 },
                                    { label: '≥ 35', score: 'BLUE' }
                                  ].map(item => (
                                    <button
                                      key={item.label}
                                      type="button"
                                      onClick={() => setEwsParameters({ ...ewsParameters, respirasi: item.score })}
                                      className={`px-3 py-2 rounded-xl font-bold text-[11px] transition-all ${ewsParameters.respirasi === item.score
                                        ? item.score === 'BLUE' ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-teal-600 text-white shadow-md scale-105'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                      {item.label} ({item.score})
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* SATURASI OKSIGEN */}
                              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <label className="block font-bold text-gray-700 mb-3 flex items-center gap-2">
                                  <div className="w-1.5 h-4 bg-cyan-500 rounded-full"></div> Saturasi Oksigen (%)
                                </label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {[
                                    { label: '> 96', score: 0 },
                                    { label: '94 - 95', score: 1 },
                                    { label: '92 - 93', score: 2 },
                                    { label: '≤ 91', score: 3 }
                                  ].map(item => (
                                    <button
                                      key={item.label}
                                      type="button"
                                      onClick={() => setEwsParameters({ ...ewsParameters, saturasi_oksigen: item.score })}
                                      className={`px-3 py-2 rounded-xl font-bold text-[11px] transition-all ${ewsParameters.saturasi_oksigen === item.score
                                        ? 'bg-cyan-600 text-white shadow-md scale-105'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                      {item.label} ({item.score})
                                    </button>
                                  ))}
                                </div>
                                <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-100">
                                  <span className="text-xs font-bold text-cyan-800 block mb-2">Suplemen Oksigen?</span>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      className={`px-4 py-2 rounded-lg font-bold text-xs ${ewsParameters.suplemen_o2 === 2 ? 'bg-cyan-600 text-white shadow-md' : 'bg-white text-gray-400 border'}`}
                                      onClick={() => setEwsParameters({ ...ewsParameters, suplemen_o2: ewsParameters.suplemen_o2 === 2 ? 0 : 2 })}
                                    > Ya (+2) </button>
                                    <button
                                      type="button"
                                      className={`px-4 py-2 rounded-lg font-bold text-xs ${ewsParameters.suplemen_o2 === 0 ? 'bg-gray-400 text-white shadow-md' : 'bg-white text-gray-400 border'}`}
                                      onClick={() => setEwsParameters({ ...ewsParameters, suplemen_o2: 0 })}
                                    > Tidak </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Data Tambahan: GDS, Skor Nyeri, Urine Output */}
                            <div className="mt-6 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm">
                              <label className="block font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                                Data Tambahan (Non-Skor)
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Form.Item label={<span className="font-semibold text-gray-600 text-xs">GDS (mg/dL)</span>} name="gds" className="mb-0">
                                  <Input placeholder="Gula Darah Sewaktu" suffix="mg/dL" className="rounded-xl" />
                                </Form.Item>
                                <Form.Item label={<span className="font-semibold text-gray-600 text-xs">Skor Nyeri (0-10)</span>} name="skor_nyeri" className="mb-0">
                                  <Input placeholder="0 - 10" className="rounded-xl" />
                                </Form.Item>
                                <Form.Item label={<span className="font-semibold text-gray-600 text-xs">Urine Output (cc/jam)</span>} name="urine_output" className="mb-0">
                                  <Input placeholder="Output urine" suffix="cc/jam" className="rounded-xl" />
                                </Form.Item>
                              </div>
                              <p className="mt-3 text-[10px] text-gray-400 italic">
                                *Data ini tidak mempengaruhi perhitungan skor EWS, namun dicatat untuk pemantauan klinis pasien.
                              </p>
                            </div>

                            {/* Summary Skor */}
                            <div className="mt-8 p-6 bg-white rounded-3xl border-2 border-indigo-100 shadow-xl shadow-indigo-50">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center text-center">
                                <div className="border-r-0 sm:border-r border-indigo-50 pr-0 sm:pr-8">
                                  <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Total Skor EWS</div>
                                  <div className="text-5xl font-black text-indigo-700 tabular-nums">
                                    {Object.values(ewsParameters).some(v => v === 'BLUE') ? 'CODE BLUE' : Object.values(ewsParameters).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Kategori Risiko</div>
                                  <div className={`text-sm font-black mt-2 py-3 px-6 rounded-2xl inline-block shadow-sm ${Object.values(ewsParameters).some(v => v === 'BLUE') ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                                    Object.values(ewsParameters).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) >= 7 ? 'bg-red-600 text-white' :
                                      Object.values(ewsParameters).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) >= 5 ? 'bg-orange-500 text-white' :
                                        Object.values(ewsParameters).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) >= 1 ? 'bg-amber-100 text-amber-700' :
                                          'bg-green-100 text-green-700'
                                    }`}>
                                    {
                                      Object.values(ewsParameters).some(v => v === 'BLUE') ? 'CODE BLUE (HEPATI NAFAS/JANTUNG)' :
                                        Object.values(ewsParameters).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) >= 7 ? 'Risiko Sangat Tinggi' :
                                          Object.values(ewsParameters).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) >= 5 ? 'Risiko Tinggi' :
                                            Object.values(ewsParameters).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) >= 1 ? 'Risiko Sedang' :
                                              'Risiko Rendah'
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-6 flex flex-col sm:flex-row gap-2">
                              <Button type="primary" htmlType="submit" loading={loading} className="rounded-lg h-10 px-8 w-full sm:w-auto">
                                {editingEws ? 'Perbarui EWS' : 'Simpan EWS'}
                              </Button>
                              {editingEws && (
                                <Button
                                  onClick={() => {
                                    setEditingEws(null);
                                    setShowEwsForm(false);
                                    setEwsParameters({
                                      kesadaran: 0,
                                      suhu: 0,
                                      tekanan_sistolik: 0,
                                      denyut_nadi: 0,
                                      respirasi: 0,
                                      saturasi_oksigen: 0,
                                      perdarahan: 0,
                                      intensive: 0
                                    });
                                  }}
                                  className="rounded-lg h-10 px-8 w-full sm:w-auto"
                                >
                                  Batal Edit
                                </Button>
                              )}
                            </div>
                          </Form>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'monitoring',
                  label: <span><LineChartOutlined /> Monitoring</span>,
                  children: (
                    <div className="space-y-4">
                      {/* Program HD Form */}
                      <Form form={monForm} layout="vertical" onFinish={onFinishMonTran}>
                        {/* Program HD */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Program HD</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-3 gap-y-0">
                            <Form.Item label="Dyaliser" name="device_hd_no" className="mb-2">
                              <Select placeholder="Pilih..." options={deviceHdList.map(d => ({ label: d.device_hd_name, value: d.device_hd_no }))} />
                            </Form.Item>
                            <Form.Item label="Mesin" name="mesin_name" className="mb-2"><Input /></Form.Item>
                            <Form.Item label="Dialisat" name="dialisat_name" className="mb-2"><Input /></Form.Item>
                            <Form.Item label="Priming" name="priming" className="mb-2"><Input /></Form.Item>
                            <Form.Item label="Sisa Priming" name="sisa_priming" className="mb-2"><Input /></Form.Item>
                            <Form.Item label="Tranfusi" name="transfusi" className="mb-2"><Input /></Form.Item>
                            <Form.Item label="Eritropoetin" name="eritro" className="mb-2"><Input /></Form.Item>
                            <Form.Item label="Lama HD" name="lama_hd" className="mb-2"><Input /></Form.Item>
                            <Form.Item label="Flushing" name="flushing" className="mb-2"><Input /></Form.Item>
                          </div>
                        </div>

                        {/* Waktu & Penyulit Selama HD */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Waktu &amp; Penyulit Selama HD</p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-0">
                            {/* Kolom Waktu dan Total UFG */}
                            <div className="col-span-1 border-r border-gray-200 pr-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">Mulai Jam</span>
                                  <Form.Item name="aw_hd" className="mb-0"><TimePicker format="HH:mm:ss" /></Form.Item>
                                  <span className="text-sm mx-1">s/d</span>
                                  <Form.Item name="ak_hd" className="mb-0"><TimePicker format="HH:mm:ss" /></Form.Item>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm w-16">Total UFG</span>
                                  <Form.Item name="total_ufg" className="mb-0"><Input className="w-24" /></Form.Item>
                                </div>
                              </div>
                            </div>

                            {/* Kolom Penyulit */}
                            <div className="col-span-2 pl-4">
                              <Space wrap align="start" size={[12, 8]}>
                                <Form.Item name="slt_akses" valuePropName="checked" className="mb-0"><Checkbox>Akses</Checkbox></Form.Item>
                                <Form.Item name="slt_darah" valuePropName="checked" className="mb-0"><Checkbox>Pendarahan</Checkbox></Form.Item>
                                <Form.Item name="slt_kepala" valuePropName="checked" className="mb-0"><Checkbox>Sakit Kepala</Checkbox></Form.Item>
                                <Form.Item name="slt_kram" valuePropName="checked" className="mb-0"><Checkbox>Kram Otot</Checkbox></Form.Item>
                                <Form.Item name="slt_mual" valuePropName="checked" className="mb-0"><Checkbox>Mual Muntah</Checkbox></Form.Item>
                                <Form.Item name="slt_dada" valuePropName="checked" className="mb-0"><Checkbox>Nyeri Dada</Checkbox></Form.Item>
                                <Form.Item name="slt_aritma" valuePropName="checked" className="mb-0"><Checkbox>Aritma</Checkbox></Form.Item>
                                <Form.Item name="slt_gatal" valuePropName="checked" className="mb-0"><Checkbox>Gatal</Checkbox></Form.Item>
                                <Form.Item name="slt_dingin" valuePropName="checked" className="mb-0"><Checkbox>Mengigil</Checkbox></Form.Item>
                                <Form.Item name="slt_hipo" valuePropName="checked" className="mb-0"><Checkbox>Hipotensi</Checkbox></Form.Item>
                                <Form.Item name="slt_hiper" valuePropName="checked" className="mb-0"><Checkbox>Hipertensi</Checkbox></Form.Item>
                                <div className="flex items-center gap-2">
                                  <Form.Item name="slt_lain" valuePropName="checked" className="mb-0"><Checkbox>Lain-lain</Checkbox></Form.Item>
                                  <Form.Item name="slt_ket" className="mb-0 w-32"><Input placeholder="..." /></Form.Item>
                                </div>
                              </Space>
                              <div className="mt-4">
                                <Button type="primary" htmlType="submit" loading={loading} className="rounded-lg h-9 px-6">
                                  Simpan Program &amp; Penyulit
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Form>

                      {/* Monitoring Item Table & Form */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-700">Riwayat Monitoring Tindakan</span>
                          <Button type="primary" icon={<HistoryOutlined />} onClick={() => {
                            setShowMonItemForm(!showMonItemForm);
                            if (!showMonItemForm) {
                              setEditingMonItem(null);
                              monItemForm.resetFields();
                            }
                          }}>
                            {showMonItemForm ? 'Batal Form Monitoring' : 'Input Baru'}
                          </Button>
                        </div>

                        <div className={showMonItemForm ? 'block' : 'hidden'}>
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-3">
                            <Form form={monItemForm} layout="vertical" onFinish={onFinishMonItem}>
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 xl:grid-cols-10 gap-x-3 gap-y-0">
                                <Form.Item label="Jam" name="jam_periksa" className="mb-2"><TimePicker format="HH:mm" className="w-full" /></Form.Item>
                                <Form.Item label="Tensi" name="tensi" className="mb-2"><Input /></Form.Item>
                                <Form.Item label="HR" name="hr" className="mb-2"><Input /></Form.Item>
                                <Form.Item label="RR" name="rr" className="mb-2"><Input /></Form.Item>
                                <Form.Item label="Suhu" name="suhu" className="mb-2"><Input /></Form.Item>
                                <Form.Item label="SPO2" name="spo2" className="mb-2"><Input /></Form.Item>
                                <Form.Item label="AntiKoag" name="ak" className="mb-2"><Input /></Form.Item>
                                <Form.Item label="AP" name="ap" className="mb-2"><Input /></Form.Item>
                                <Form.Item label="TMP" name="tmp" className="mb-2"><Input /></Form.Item>
                                <Form.Item label="VP" name="vp" className="mb-2"><Input /></Form.Item>
                                <Form.Item label="QB" name="qb" className="mb-2"><Input /></Form.Item>
                                <Form.Item label="QD" name="qd" className="mb-2"><Input /></Form.Item>
                                <Form.Item label="UFG" name="ufg" className="mb-2"><Input /></Form.Item>
                                <Form.Item label="UFR" name="ufr" className="mb-2"><Input /></Form.Item>
                              </div>
                              <div className="flex gap-2 justify-between mt-2">
                                <div className="flex gap-2">
                                  <Button type="primary" htmlType="submit" loading={loading} className="bg-green-600 hover:bg-green-700 border-none rounded-lg px-6">
                                    {editingMonItem ? 'Simpan Ubahan' : 'Tambah Monitoring'}
                                  </Button>
                                  {editingMonItem && (
                                    <Button className="rounded-lg" onClick={() => {
                                      setShowMonItemForm(false);
                                      setEditingMonItem(null);
                                      monItemForm.resetFields();
                                    }}>
                                      Batal Edit
                                    </Button>
                                  )}
                                </div>
                                {!editingMonItem && (
                                  <Button type="default" icon={<CopyOutlined />} className="rounded-lg" onClick={handleCopyLastMonitoring}>
                                    Salin dari Item Terakhir
                                  </Button>
                                )}
                              </div>
                            </Form>
                          </div>
                        </div>

                        <Table
                          size="small"
                          dataSource={monHdItems}
                          rowKey="mon_hd_item_no"
                          scroll={{ x: 1000 }}
                          columns={[
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">Jam</span>, dataIndex: 'jam_periksa', width: 70, align: 'center', render: (t) => <span className="text-xs font-semibold text-slate-800">{dayjs(t).format('HH:mm')}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">Tensi</span>, dataIndex: 'tensi', align: 'center', render: (v) => <span className="text-[11px] font-semibold text-red-700 bg-red-50 py-0.5 px-2 rounded-full">{v || '-'}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">HR</span>, dataIndex: 'hr', align: 'center', render: (v) => <span className="text-[11px] font-semibold text-violet-700 bg-violet-50 py-0.5 px-2 rounded-full">{v || '-'}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">RR</span>, dataIndex: 'rr', align: 'center', render: (v) => <span className="text-[11px] font-semibold text-green-700 bg-green-50 py-0.5 px-2 rounded-full">{v || '-'}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">Suhu</span>, dataIndex: 'suhu', align: 'center', render: (v) => <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 py-0.5 px-2 rounded-full">{v || '-'}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">SPO2</span>, dataIndex: 'spo2', align: 'center', render: (v) => <span className="text-[11px] font-semibold text-cyan-700 bg-cyan-50 py-0.5 px-2 rounded-full">{v || '-'}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">AntiKoag</span>, dataIndex: 'ak', align: 'center', render: (v) => <span className="text-[11px] font-medium block text-center min-w-[40px] text-gray-700">{v || '-'}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">AP</span>, dataIndex: 'ap', align: 'center', render: (v) => <span className="text-[11px] font-medium block text-center min-w-[40px] text-gray-700">{v || '-'}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">TMP</span>, dataIndex: 'tmp', align: 'center', render: (v) => <span className="text-[11px] font-medium block text-center min-w-[40px] text-gray-700">{v || '-'}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">VP</span>, dataIndex: 'vp', align: 'center', render: (v) => <span className="text-[11px] font-medium block text-center min-w-[40px] text-gray-700">{v || '-'}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">QB</span>, dataIndex: 'qb', align: 'center', render: (v) => <span className="text-[11px] font-medium block text-center min-w-[40px] text-blue-700">{v || '-'}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">QD</span>, dataIndex: 'qd', align: 'center', render: (v) => <span className="text-[11px] font-medium block text-center min-w-[40px] text-blue-700">{v || '-'}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">UFG</span>, dataIndex: 'ufg', align: 'center', render: (v) => <span className="text-[11px] font-medium block text-center min-w-[40px] text-indigo-700">{v || '-'}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">UFR</span>, dataIndex: 'ufr', align: 'center', render: (v) => <span className="text-[11px] font-medium block text-center min-w-[40px] text-indigo-700">{v || '-'}</span> },
                            { title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">Nama PPA</span>, dataIndex: 'nama_petugas', width: 100, render: (v) => <div className="text-[10px] text-gray-600 uppercase leading-snug break-words">{v || '-'}</div> },
                            {
                              title: <span className="text-[10px] text-center font-bold uppercase tracking-wider text-gray-500">Opsi</span>, align: 'center', width: 60,
                              render: (_, record) => (
                                <div className="flex flex-col gap-1 justify-center items-center">
                                  <Button size="small" type="link" className="text-[10px] h-4 p-0 text-blue-600 m-0 leading-none" onClick={() => handleEditMonItem(record)}>Ubah</Button>
                                  <Button size="small" type="link" danger className="text-[10px] h-4 p-0 m-0 leading-none" onClick={() => handleDeleteMonItem(record.mon_hd_item_no)}>Hapus</Button>
                                </div>
                              )
                            }
                          ]}
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  key: '5',
                  label: <span><AlertOutlined /> Code Blue</span>,
                  children: (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-700">Daftar Code Blue</span>
                        <Button type="primary" icon={<AlertOutlined />} danger size="small" onClick={() => {
                          setShowCodeBlueForm(!showCodeBlueForm);
                          if (!showCodeBlueForm) {
                            setEditingCodeBlue(null);
                            codeBlueForm.resetFields();
                          }
                        }}>
                          {showCodeBlueForm ? 'Batal Form Code Blue' : 'Input Code Blue Baru'}
                        </Button>
                      </div>

                      <div className={showCodeBlueForm ? 'block' : 'hidden'}>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                          <Form form={codeBlueForm} layout="vertical" onFinish={onFinishCodeBlue}>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              {/* Kolom 1 */}
                              <div className="space-y-4">
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="font-semibold text-blue-900 border-b pb-1 mb-2">Aktivasi Code Blue</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Form.Item label="Waktu" name="tgl_periksa" className="mb-0"><TimePicker format="HH:mm:ss" /></Form.Item>
                                    <Form.Item label="Respon Awal" name="resp_awal" className="mb-0">
                                      <Select options={[{ label: 'Tim Primer', value: '1' }, { label: 'Awam Terlatih', value: '2' }]} />
                                    </Form.Item>
                                    <Form.Item label="Respon Time" name="resp_awal_lama" className="mb-0 mt-2"><Input /></Form.Item>
                                  </div>
                                  <div className="mt-2 text-xs">
                                    <Flex vertical gap={2}>
                                      <Form.Item name="cb_kriteria_hj" valuePropName="checked" className="mb-0"><Checkbox>Henti Jantung</Checkbox></Form.Item>
                                      <Form.Item name="cb_kriteria_hn" valuePropName="checked" className="mb-0"><Checkbox>Henti Nafas</Checkbox></Form.Item>
                                      <Form.Item name="cb_kriteria_gm" valuePropName="checked" className="mb-0"><Checkbox>Kegawatan Medis</Checkbox></Form.Item>
                                    </Flex>
                                  </div>
                                </div>
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="font-semibold text-blue-900 border-b pb-1 mb-2">Kegawatan Medis</p>
                                  <div className="text-xs">
                                    <Flex vertical gap={2}>
                                      <Form.Item name="gm_kriteria_aw" valuePropName="checked" className="mb-0"><Checkbox>Airway: Obstruksi jalan nafas</Checkbox></Form.Item>
                                      <Form.Item name="gm_kriteria_bre" valuePropName="checked" className="mb-0"><Checkbox>Breathing: RR {'>'}35 atau {'<'}5</Checkbox></Form.Item>
                                      <Form.Item name="gm_kriteria_sir" valuePropName="checked" className="mb-0"><Checkbox>Sirkulasi: HR {'>'}140/{'<'}40, TD {'>'}220/{'<'}70</Checkbox></Form.Item>
                                      <Form.Item name="gm_kriteria_neu" valuePropName="checked" className="mb-0"><Checkbox>Neurologi: Turun Kesadaran/Kejang</Checkbox></Form.Item>
                                      <Form.Item name="gm_kriteria_ews" valuePropName="checked" className="mb-0"><Checkbox>Skor EWS {'>='} 7</Checkbox></Form.Item>
                                    </Flex>
                                  </div>
                                </div>
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="font-semibold text-blue-900 border-b pb-1 mb-2">Disabilitas</p>
                                  <div className="grid grid-cols-3 gap-2 mb-2">
                                    <Form.Item label="GCS E" name="pm_dis_gcs_e" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="M" name="pm_dis_gcs_m" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="V" name="pm_dis_gcs_v" className="mb-0"><Input /></Form.Item>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Form.Item label="Pupil" name="pm_dis_pupil_ket" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="Refleks CA" name="pm_dis_ref_ket" className="mb-0"><Input /></Form.Item>
                                  </div>
                                  <Form.Item label="Plegi/Parese" name="pm_dis_plegi_ket" className="mb-0 mt-2"><Input /></Form.Item>
                                </div>
                              </div>

                              {/* Kolom 2 */}
                              <div className="space-y-4">
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="font-semibold text-blue-900 border-b pb-1 mb-2">Asesmen Awal Primary</p>
                                  <Form.Item label="Respon" name="pm_respon_awal" className="mb-2">
                                    <Radio.Group>
                                      <Radio value="1">Sadar</Radio>
                                      <Radio value="2">Merespon Suara</Radio>
                                      <Radio value="3">Nyeri</Radio>
                                      <Radio value="4">Tdk Respon</Radio>
                                    </Radio.Group>
                                  </Form.Item>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <span className="font-semibold text-xs block text-gray-500 uppercase mb-1 border-b">Jalan Nafas</span>
                                      <Form.Item name="pm_ass_jalan_nafas" className="mb-2">
                                        <Radio.Group className="flex flex-col text-xs">
                                          <Radio value="1">Obstruksi Total</Radio>
                                          <Radio value="2">Obstruksi Parsial</Radio>
                                          <Radio value="3">Normal</Radio>
                                        </Radio.Group>
                                      </Form.Item>
                                      <span className="font-semibold text-xs block text-gray-500 uppercase mb-1 border-b">Pernafasan</span>
                                      <div className="text-xs">
                                        <Flex vertical gap={0}>
                                          <Form.Item name="pm_ass_nafas_apneu" valuePropName="checked" className="mb-0"><Checkbox>Apneu/Gasping</Checkbox></Form.Item>
                                          <Form.Item name="pm_ass_nafas_sesak" valuePropName="checked" className="mb-0"><Checkbox>Sesak Nafas</Checkbox></Form.Item>
                                          <Form.Item name="pm_ass_nafas_sianosis" valuePropName="checked" className="mb-0"><Checkbox>Sianosis</Checkbox></Form.Item>
                                          <Form.Item name="pm_ass_nafas_retraksi" valuePropName="checked" className="mb-0"><Checkbox>Retraksi otot</Checkbox></Form.Item>
                                          <Form.Item name="pm_ass_nafas_normal" valuePropName="checked" className="mb-0"><Checkbox>Normal</Checkbox></Form.Item>
                                        </Flex>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="font-semibold text-xs block text-gray-500 uppercase mb-1 border-b">Sirkulasi</span>
                                      <div className="text-xs">
                                        <Flex vertical gap={0}>
                                          <Form.Item name="pm_sir_nadi" valuePropName="checked" className="mb-0"><Checkbox>Nadi tak teraba</Checkbox></Form.Item>
                                          <Form.Item name="pm_sir_taki" valuePropName="checked" className="mb-0"><Checkbox>Takikardia</Checkbox></Form.Item>
                                          <Form.Item name="pm_sir_bradi" valuePropName="checked" className="mb-0"><Checkbox>Bradikardia</Checkbox></Form.Item>
                                          <Form.Item name="pm_sir_hipotensi" valuePropName="checked" className="mb-0"><Checkbox>Hipotensi</Checkbox></Form.Item>
                                          <Form.Item name="pm_sir_hipertensi" valuePropName="checked" className="mb-0"><Checkbox>Hipertensi</Checkbox></Form.Item>
                                          <Form.Item name="pm_sir_irama" valuePropName="checked" className="mb-0"><Checkbox>Irama ireguler</Checkbox></Form.Item>
                                          <Form.Item name="pm_sir_normal" valuePropName="checked" className="mb-0"><Checkbox>Normal</Checkbox></Form.Item>
                                        </Flex>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="font-semibold text-blue-900 border-b pb-1 mb-2">Tanda Vital Code Blue</p>
                                  <div className="grid grid-cols-3 gap-2">
                                    <Form.Item label="Tensi" name="pm_tensi" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="Nadi" name="pm_nadi" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="Nafas" name="pm_nafas" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="Suhu" name="pm_suhu" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="SpO2" name="pm_spo2" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="Nyeri" name="pm_skor_nyeri" className="mb-0"><Input /></Form.Item>
                                  </div>
                                </div>
                              </div>

                              {/* Kolom 3 */}
                              <div className="space-y-4">
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="font-semibold text-blue-900 border-b pb-1 mb-2">Secondary Mgmt &amp; Asesmen</p>
                                  <Form.Item label="Anamnesa" name="sm_anamnesa" className="mb-2"><Input.TextArea rows={2} /></Form.Item>
                                  <Form.Item label="Pemeriksaan Fisik" name="pem_fisik" className="mb-2"><Input.TextArea rows={2} /></Form.Item>
                                  <Form.Item label="Diagnosa Kerja" name="diagnosa" className="mb-2"><Input.TextArea rows={2} /></Form.Item>
                                  <Form.Item label="Terapi / Asesmen" name="pm_asesment" className="mb-2"><Input.TextArea rows={2} /></Form.Item>
                                </div>

                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="font-semibold text-blue-900 border-b pb-1 mb-2">Kriteria Paska Resusitasi</p>
                                  <Form.Item name="kriteria_hasil" className="mb-2" label={<span className="text-xs">Kondisi</span>}>
                                    <Radio.Group className="flex flex-wrap gap-2 text-xs">
                                      <Radio value="0">Loc 0</Radio>
                                      <Radio value="1">Loc 1</Radio>
                                      <Radio value="2">Loc 2</Radio>
                                      <Radio value="3">Loc 3</Radio>
                                      <Radio value="D">DNR</Radio>
                                      <Radio value="M">Meninggal</Radio>
                                    </Radio.Group>
                                  </Form.Item>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Form.Item label="Transfer ke" name="kd_ruang_tujuan" className="mb-0"><Input /></Form.Item>
                                    <Form.Item label="Jam Transfer" name="tgl_transfer" className="mb-0"><TimePicker format="HH:mm:ss" /></Form.Item>
                                  </div>
                                  <Form.Item label="Keterangan Tambahan" name="ket" className="mb-0 mt-2"><Input /></Form.Item>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4 pt-3 border-t border-red-200">
                              <Button type="primary" htmlType="submit" loading={loading} danger className="rounded-lg px-8 font-semibold shadow-md">
                                {editingCodeBlue ? 'Simpan Perubahan Code Blue' : 'Simpan Code Blue'}
                              </Button>
                              {editingCodeBlue && (
                                <Button className="rounded-lg" onClick={() => {
                                  setShowCodeBlueForm(false);
                                  setEditingCodeBlue(null);
                                  codeBlueForm.resetFields();
                                }}>
                                  Batal Edit
                                </Button>
                              )}
                            </div>
                          </Form>
                        </div>
                      </div>

                      <Table
                        size="small"
                        dataSource={codeBlueData}
                        rowKey="code_blue_no"
                        scroll={{ x: 800 }}
                        columns={[
                          { title: <span className="text-[10px] uppercase font-bold text-gray-500">Waktu</span>, dataIndex: 'tgl_periksa', align: 'center', width: 140, render: (t) => <span className="font-semibold text-xs text-red-600">{t}</span> },
                          { title: <span className="text-[10px] uppercase font-bold text-gray-500">Respon Awal</span>, dataIndex: 'resp_awal', align: 'center', render: (v) => <span className="text-[10px] uppercase bg-gray-100 px-2 py-0.5 rounded">{v === '1' ? 'Tim Primer' : (v === '2' ? 'Awam Terlatih' : '-')}</span> },
                          { title: <span className="text-[10px] uppercase font-bold text-gray-500">Tensi</span>, dataIndex: 'pm_tensi', align: 'center', render: (v) => <span className="text-xs">{v || '-'}</span> },
                          { title: <span className="text-[10px] uppercase font-bold text-gray-500">Nadi</span>, dataIndex: 'pm_nadi', align: 'center', render: (v) => <span className="text-xs">{v || '-'}</span> },
                          { title: <span className="text-[10px] uppercase font-bold text-gray-500">RR</span>, dataIndex: 'pm_nafas', align: 'center', render: (v) => <span className="text-xs">{v || '-'}</span> },
                          { title: <span className="text-[10px] uppercase font-bold text-gray-500">Diagnosa</span>, dataIndex: 'diagnosa', render: (v) => <span className="text-xs">{v || '-'}</span> },
                          { title: <span className="text-[10px] uppercase font-bold text-gray-500">Keterangan</span>, dataIndex: 'ket', render: (v) => <span className="text-xs text-gray-500">{v || '-'}</span> },
                          {
                            title: <span className="text-[10px] uppercase font-bold text-gray-500">Opsi</span>, align: 'center', width: 100,
                            render: (_, record) => (
                              <div className="flex gap-2 justify-center">
                                <Button size="small" type="link" className="text-xs p-0 m-0" onClick={() => handleEditCodeBlue(record)}>Ubah</Button>
                                <Button size="small" type="link" danger className="text-xs p-0 m-0" onClick={() => handleDeleteCodeBlue(record.code_blue_no)}>Hapus</Button>
                              </div>
                            )
                          }
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: 'transfer',
                  label: <span><HistoryOutlined /> Transfer Internal</span>,
                  children: (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <Form form={transferForm} layout="horizontal" onFinish={onFinishTransfer} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Kiri: Data Dasar & Pengirim */}
                            <div className="space-y-4">
                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm pt-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Informasi Dasar</p>
                                <Form.Item label="Asal Ruang" name="kd_ruang_asal" className="mb-2" initialValue="517">
                                  <Select
                                    disabled
                                    placeholder="Pilih..."
                                    options={[
                                      { value: '517', label: 'Hemodialisa' },
                                      ...(Array.isArray(ruangHD) ? ruangHD : []).filter(r => r.kd_ruang && r.kd_ruang !== '517').map(r => ({ value: r.kd_ruang, label: r.klinik_name }))
                                    ]}
                                  />
                                </Form.Item>
                                <Form.Item label="Tujuan Ruang" name="kd_ruang_tujuan" className="mb-2">
                                  <Select
                                    placeholder="Ketik/pilih ruang tujuan..."
                                    showSearch
                                    filterOption={(input, option) =>
                                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={Array.from(new Map((Array.isArray(allRuangList) ? allRuangList : []).filter(r => r.kd_ruang).map(r => [r.kd_ruang, { value: r.kd_ruang, label: r.klinik_name?.replace(/^[0-9]+\s*-\s*/, '') }])).values())}
                                  />
                                </Form.Item>
                                <Form.Item label="Kategori" name="kat_transfer" className="mb-2">
                                  <Radio.Group>
                                    <Flex vertical gap={1}>
                                      <Radio value="0">Level 0 (Ruang biasa)</Radio>
                                      <Radio value="1">Level 1 (Pengawasan)</Radio>
                                      <Radio value="2">Level 2 (Observasi ketat)</Radio>
                                      <Radio value="3">Level 3 (Gagal multi organ)</Radio>
                                    </Flex>
                                  </Radio.Group>
                                </Form.Item>
                                <Form.Item label="Anamnesa" name="anamnesa" className="mb-2"><Input.TextArea rows={2} /></Form.Item>
                                <Form.Item label="Diagnosa" name="diagnosa" className="mb-2"><Input.TextArea rows={2} /></Form.Item>
                                <Form.Item label="Petugas Pendamping" className="mb-2">
                                  <Flex gap={2} wrap="wrap">
                                    <Form.Item name="pend_portir" valuePropName="checked" noStyle><Checkbox>Portir</Checkbox></Form.Item>
                                    <Form.Item name="pend_perawat" valuePropName="checked" noStyle><Checkbox>Perawat</Checkbox></Form.Item>
                                    <Form.Item name="pend_bidan" valuePropName="checked" noStyle><Checkbox>Bidan</Checkbox></Form.Item>
                                    <Form.Item name="pend_dokter" valuePropName="checked" noStyle><Checkbox>Dokter</Checkbox></Form.Item>
                                  </Flex>
                                </Form.Item>
                                <Form.Item label="Kompetensi" name="komp_pendamping" className="mb-2">
                                  <Radio.Group>
                                    <Flex gap={2} wrap="wrap">
                                      <Radio value="1">EN</Radio>
                                      <Radio value="2">BT-CLS</Radio>
                                      <Radio value="3">PPGD</Radio>
                                      <Radio value="4">APN</Radio>
                                      <Radio value="5">ACLS</Radio>
                                    </Flex>
                                  </Radio.Group>
                                </Form.Item>
                              </div>

                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm pt-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Kondisi Sebelum Transfer</p>
                                <div className="grid grid-cols-5 gap-2 mb-2">
                                  <Form.Item label="Tensi" name="tensi" labelCol={{ span: 24 }}><Input placeholder="Tensi" /></Form.Item>
                                  <Form.Item label="Nadi" name="nadi" labelCol={{ span: 24 }}><Input placeholder="Nadi" /></Form.Item>
                                  <Form.Item label="Suhu" name="suhu" labelCol={{ span: 24 }}><Input placeholder="Suhu" /></Form.Item>
                                  <Form.Item label="RR" name="rr" labelCol={{ span: 24 }}><Input placeholder="RR" /></Form.Item>
                                  <Form.Item label="SpO2" name="spo2" labelCol={{ span: 24 }}><Input placeholder="SpO2" /></Form.Item>
                                </div>
                                <Form.Item label="Kondisi" name="ku" className="mb-2"><Input.TextArea rows={2} /></Form.Item>
                                <Form.Item label="Waktu" name="tgl_transfer" className="mb-2"><DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} /></Form.Item>
                              </div>
                            </div>

                            {/* Kanan: Histori & Penerima */}
                            <div className="space-y-4">
                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm pt-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Kondisi Setelah Transfer (Penerima)</p>
                                <div className="grid grid-cols-5 gap-2 mb-2">
                                  <Form.Item label="Tensi" name="tensi2" labelCol={{ span: 24 }}><Input disabled={transferType === 'OUT'} placeholder="Tensi" /></Form.Item>
                                  <Form.Item label="Nadi" name="nadi2" labelCol={{ span: 24 }}><Input disabled={transferType === 'OUT'} placeholder="Nadi" /></Form.Item>
                                  <Form.Item label="Suhu" name="suhu2" labelCol={{ span: 24 }}><Input disabled={transferType === 'OUT'} placeholder="Suhu" /></Form.Item>
                                  <Form.Item label="RR" name="rr2" labelCol={{ span: 24 }}><Input disabled={transferType === 'OUT'} placeholder="RR" /></Form.Item>
                                  <Form.Item label="SpO2" name="spo22" labelCol={{ span: 24 }}><Input disabled={transferType === 'OUT'} placeholder="SpO2" /></Form.Item>
                                </div>
                                <Form.Item label="Kondisi" name="ku2" className="mb-2"><Input.TextArea disabled={transferType === 'OUT'} rows={2} /></Form.Item>
                                <Form.Item label="Diterima" name="tgl_terima" className="mb-4"><DatePicker disabled={transferType === 'OUT'} showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} /></Form.Item>

                                <div className="flex justify-end gap-2">
                                  <Button type="primary" htmlType="submit" loading={loading} className="bg-blue-600">Simpan Data</Button>
                                  <Button onClick={() => { transferForm.resetFields(); transferForm.setFieldsValue({ kd_ruang_asal: '517' }); setEditingTransfer(null); setTransferType('OUT'); }}>Batal</Button>
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative pt-6 mt-4">
                                <span className="absolute top-0 left-4 -translate-y-1/2 bg-gray-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Histori Transfer Pasien</span>
                                <Table
                                  size="small"
                                  dataSource={transferData}
                                  rowKey="trf_int_no"
                                  pagination={false}
                                  scroll={{ y: 220 }}
                                  columns={[
                                    { title: <span className="text-[10px]">Waktu</span>, dataIndex: 'tgl_transfer', width: 110, render: v => <span className="text-[10px] font-medium">{v ? dayjs(v).format('DD/MM/YY HH:mm') : '-'}</span> },
                                    { title: <span className="text-[10px]">Asal</span>, dataIndex: 'as_ruang_name', render: v => <span className="text-[10px]">{v}</span> },
                                    { title: <span className="text-[10px]">Tujuan</span>, dataIndex: 'tujuan_ruang_name', render: v => <span className="text-[10px]">{v}</span> },
                                    {
                                      title: <span className="text-[10px]">Opsi</span>,
                                      render: (_, record) => (
                                        <div className="flex gap-1">
                                          <Button size="small" type="link" className="text-[10px] p-0" onClick={() => handleEditTransfer(record)}>Ubah</Button>
                                          {!record.tgl_terima && (
                                            <Button size="small" type="link" className="text-[10px] p-0 text-green-600" onClick={() => handleTerimaTransfer(record)}>Terima</Button>
                                          )}
                                        </div>
                                      )
                                    }
                                  ]}
                                />
                              </div>
                            </div>
                          </div>
                        </Form>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'tindakan_transfusi',
                  label: <span><AuditOutlined /> Tindakan & Transfusi</span>,
                  children: (
                    <div className="space-y-4">
                      <Tabs
                        type="card"
                        size="small"
                        items={[
                          {
                            key: 'dialisis',
                            label: <span><ExperimentOutlined /> Pelayanan Dialisis</span>,
                            children: renderDialisisTab()
                          },
                          {
                            key: 'transfusi',
                            label: <span><ContainerOutlined /> Layanan & Monitoring Transfusi</span>,
                            children: renderTransfusiTab()
                          }
                        ]}
                      />
                    </div>
                  )
                },
                {
                  key: 'order_lab',
                  label: <span><ExperimentOutlined /> Order Laborat</span>,
                  children: (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm relative pt-8">
                        <span className="absolute top-0 left-4 -translate-y-1/2 bg-cyan-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Form Order Laboratorium</span>
                        <Form form={orderLabForm} layout="vertical" onFinish={onFinishOrderLab} initialValues={{ tgl_ren_periksa: dayjs() }}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item label="Tanggal Rencana Periksa" name="tgl_ren_periksa" rules={[{ required: true, message: 'Wajib diisi' }]}>
                              <DatePicker className="w-full" format="DD/MM/YYYY" />
                            </Form.Item>
                            <Form.Item label="Dokter" name="ni_dokter" rules={[{ required: true, message: 'Wajib diisi' }]}>
                              <Select
                                showSearch
                                placeholder="Pilih Dokter"
                                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                options={dokterList.map(d => ({ value: d.ni_dokter, label: d.dokter_name }))}
                              />
                            </Form.Item>
                          </div>
                          <Form.Item label="Diagnosa" name="diagnosa" className="mb-3">
                            <Input.TextArea rows={2} placeholder="Ketik diagnosa klinis..." />
                          </Form.Item>
                          <Form.Item label="Keterangan Order" name="order_ket" className="mb-4">
                            <Input.TextArea rows={2} placeholder="Isian pemeriksaan laboratorium yang diminta..." />
                          </Form.Item>
                          <div className="flex gap-2">
                            <Button type="primary" htmlType="submit" loading={loading} icon={editingOrderLab ? <EditOutlined /> : <CloudUploadOutlined />} className={editingOrderLab ? "bg-orange-600 hover:bg-orange-700" : "bg-cyan-600 hover:bg-cyan-700"}>
                              {editingOrderLab ? 'Perbarui Order Laborat' : 'Simpan Order Laborat'}
                            </Button>
                            {editingOrderLab && (
                              <Button onClick={() => { orderLabForm.resetFields(); setEditingOrderLab(null); }}>
                                Batal
                              </Button>
                            )}
                          </div>
                        </Form>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative pt-8 mt-4">
                        <span className="absolute top-0 left-4 -translate-y-1/2 bg-gray-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                          <HistoryOutlined className="text-[10px]" /> Riwayat Order (Unit HD)
                        </span>
                        <Table
                          size="small"
                          dataSource={orderLabData}
                          rowKey="ts_order_lab_no"
                          scroll={{ x: 900 }}
                          columns={[
                            { title: 'Tgl Order', dataIndex: 'tgl_order', width: 120, render: v => <span className="text-xs font-semibold">{v ? dayjs(v).format('DD/MM/YY') : '-'}</span> },
                            { title: 'Tgl Rencana', dataIndex: 'tgl_ren_periksa', width: 120, render: v => <Tag color="blue">{v ? dayjs(v).format('DD/MM/YYYY') : '-'}</Tag> },
                            { title: 'Dokter', dataIndex: 'dokter_name', width: 180, render: v => <span className="text-xs font-medium text-slate-700">{v || '-'}</span> },
                            { title: 'Diagnosa', dataIndex: 'diagnosa', render: v => <div className="text-xs text-slate-500 max-w-[150px] truncate" title={v}>{v || '-'}</div> },
                            { title: 'Keterangan Order', dataIndex: 'order_ket', render: v => <div className="text-xs font-medium text-indigo-600 bg-indigo-50/50 p-1 px-2 rounded truncate max-w-[200px]" title={v}>{v || '-'}</div> },
                            {
                              title: 'Opsi',
                              key: 'action',
                              width: 100,
                              fixed: 'right',
                              render: (_, record) => (
                                <div className="flex gap-2">
                                  <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEditOrderLab(record)} />
                                  <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteOrderLab(record.ts_order_lab_no)} />
                                </div>
                              )
                            }
                          ]}
                        />
                      </div>
                    </div>
                  )
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Template SOAP Modal */}
      <Modal
        title={isSdkiMode && (templateType === 'A' || templateType === 'P') ? `Template SDKI ${templateType === 'A' ? 'Asesmen' : 'Plan'}` : `Template ${templateType === 'S' ? 'Subjektif' : templateType === 'O' ? 'Objektif' : templateType === 'A' ? 'Asesmen' : 'Plan'}`}
        open={templateVisible}
        onCancel={() => { setTemplateVisible(false); setSdkiPlanSelected([]); }}
        footer={isSdkiMode && templateType === 'P' ? (
          <div className="pt-2">
            <Button type="primary" size="large" className="w-full" onClick={handleApplySdkiPlan} disabled={sdkiPlanSelected.length === 0}>
              Terapkan {sdkiPlanSelected.length > 0 && `(${sdkiPlanSelected.length})`} Plan SDKI ke Rekam Medis
            </Button>
          </div>
        ) : null}
        width={560}
      >
        {(!isSdkiMode || (templateType !== 'A' && templateType !== 'P')) && (
          <div className="mb-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Tulis template baru..." 
                value={templateInput}
                onChange={e => setTemplateInput(e.target.value)}
                onPressEnter={handleSaveTemplate}
              />
              <Button type="primary" onClick={handleSaveTemplate} loading={templateLoading}>
                {editingTemplate ? 'Simpan' : 'Tambah'}
              </Button>
              {editingTemplate && (
                <Button onClick={() => { setEditingTemplate(null); setTemplateInput(''); }}>Batal</Button>
              )}
            </div>
          </div>
        )}
        <div className="mb-4">
          <Input 
            placeholder="Cari template..." 
            prefix={<SearchOutlined className="text-gray-400" />}
            value={templateSearch}
            onChange={e => setTemplateSearch(e.target.value)}
            allowClear
          />
        </div>
        {templateLoading ? (
          <div className="py-8 text-center text-gray-400">Memuat template...</div>
        ) : templateList.length === 0 ? (
          <div className="py-8 text-center text-gray-400">Tidak ada template tersedia</div>
        ) : (
          <List
            size="small"
            dataSource={templateList.filter(item => {
              if (!templateSearch) return true;
              const tName = ((isSdkiMode && templateType === 'A') ? item.diag_nama : (isSdkiMode && templateType === 'P') ? item.tind_nama : item.name) || '';
              return tName.toLowerCase().includes(templateSearch.toLowerCase());
            })}
            className="h-[400px] overflow-y-auto pr-2"
            renderItem={item => {
              const isPlanSDKI = isSdkiMode && templateType === 'P';
              const isChecked = isPlanSDKI && sdkiPlanSelected.some(s => s.tind_code === item.tind_code);
              
              return (
                <List.Item
                  className={`hover:bg-indigo-50 rounded px-2 py-1 transition-colors flex justify-between group ${isChecked ? 'bg-indigo-50 border border-indigo-200' : 'border border-transparent'}`}
                >
                  <div 
                    className="flex-1 cursor-pointer flex items-start gap-3"
                    onClick={() => {
                      if (isPlanSDKI) {
                        if (isChecked) {
                          setSdkiPlanSelected(prev => prev.filter(s => s.tind_code !== item.tind_code));
                        } else {
                          setSdkiPlanSelected(prev => [...prev, item]);
                        }
                      } else {
                        applyTemplate(item);
                      }
                    }}
                  >
                    {isPlanSDKI && (
                      <div className="mt-1.5"><Checkbox checked={isChecked} /></div>
                    )}
                    <div className="flex-1">
                      <span className={`text-sm whitespace-pre-wrap block py-1 ${isChecked ? 'text-indigo-800 font-semibold' : 'text-slate-800'}`}>
                        {(isSdkiMode && templateType === 'A') ? item.diag_nama : isPlanSDKI ? item.tind_nama : item.name}
                      </span>
                      {(isSdkiMode && templateType === 'A') && <div className="text-[10px] text-gray-500 font-mono font-bold mb-1">{item.diag_code}</div>}
                      {isPlanSDKI && <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{item.interv_jenis}</div>}
                    </div>
                  </div>
                  {(!isSdkiMode || (templateType !== 'A' && templateType !== 'P')) && (
                    <div className="hidden group-hover:flex items-center gap-1 ml-2">
                      <Button size="small" type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => { setEditingTemplate(item); setTemplateInput(item.name); }} />
                      <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteTemplate(item.no)} />
                    </div>
                  )}
                </List.Item>
              );
            }}
          />
        )}
      </Modal>

      {/* Copy SOAP Modal */}
      <Modal
        title={<span><CopyOutlined className="mr-2" />Copy SOAP ke Form</span>}
        open={copySOAPVisible}
        onCancel={() => setCopySOAPVisible(false)}
        onOk={handleCopySOAP}
        okText="Copy"
        width={560}
        destroyOnHidden
      >
        {(() => {
          const soapHistory = cpptData
            .filter(r => !currentPPA || r.soap_jns === currentPPA.kd_profesi)
            .slice(0, 2);
          return (
            <div className="space-y-4 pt-1">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Pilih sumber SOAP:</p>
                <Radio.Group
                  value={copySOAPSource?.ass_no}
                  onChange={e => setCopySOAPSource(soapHistory.find(r => r.ass_no === e.target.value))}
                  className="w-full"
                >
                  <Space orientation="vertical" className="w-full">
                    {soapHistory.map(r => (
                      <Radio key={r.ass_no} value={r.ass_no} className="w-full">
                        <div className="text-xs">
                          <span className="font-semibold">{dayjs(r.tgl_periksa).format('DD/MM/YYYY HH:mm')}</span>
                          <span className="text-gray-500 ml-2">{r.nama_petugas || '-'} ({r.nama_profesi || '-'})</span>
                          <div className="text-gray-400 mt-0.5 truncate max-w-xs">{r.subjektif || '-'}</div>
                        </div>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Pilih bagian yang akan dicopy:</p>
                <Checkbox.Group
                  value={copySOAPParts}
                  onChange={setCopySOAPParts}
                  options={[
                    { label: 'Subjektif (S)', value: 'S' },
                    { label: 'Objektif (O)', value: 'O' },
                    { label: 'Asesmen (A)', value: 'A' },
                    { label: 'Plan (P)', value: 'P' },
                  ]}
                />
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Search Modal */}
      <Modal
        title={
          <Flex justify="space-between" align="center" className="pr-8">
            <span>Daftar Pasien Hari Ini</span>
            <Input
              placeholder="Cari nama atau No RM..."
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              allowClear
              autoFocus
            />
          </Flex>
        }
        open={isSearchModalOpen}
        onCancel={() => setIsSearchModalOpen(false)}
        footer={null}
        width={900}
      >
        <Table
          dataSource={sortedPatients}
          columns={columns}
          loading={loading}
          rowKey="mut_no"
          pagination={false}
          scroll={{ y: 500 }}
          size="small"
          rowClassName={(record) => {
            const hasSoap = record.soaps_today && record.soaps_today.split(',').includes(currentPPA?.kd_profesi?.toString());
            const isNursingProfesi = currentPPA && (String(currentPPA.kd_profesi) === '2' || String(currentPPA.nama_profesi).toLowerCase().includes('perawat'));
            let classes = "cursor-pointer transition-all ";
            
            // Highlight for "Active Selection" (First Unfinished)
            const isActiveSelection = isNursingProfesi && record.mut_no === firstUnfinished?.mut_no;
            
            if (isActiveSelection) {
              classes += "bg-blue-50 border-l-4 border-blue-500 font-semibold ring-1 ring-blue-100 ";
            } else if (isNursingProfesi && hasSoap) {
              classes += "bg-slate-200 opacity-60 "; // Grey for finished
            }

            if (selectedPatient?.mut_no === record.mut_no) {
              classes += "ring-2 ring-indigo-400 ring-inset ";
            }
            return classes;
          }}
          onRow={(record) => ({
            onClick: () => {
              handleSelectPatient(record);
              setIsSearchModalOpen(false);
            }
          })}
        />
      </Modal>

      {/* MR Search Modal */}
      <Modal
        title={
          <Flex justify="space-between" align="center" className="pr-8">
            <span>Cari Berdasarkan No RM (Riwayat REGISTER)</span>
          </Flex>
        }
        open={isMrSearchModalOpen}
        onCancel={() => {
          setIsMrSearchModalOpen(false);
          setMrSearchTerm('');
          setMrHistoryResults([]);
        }}
        footer={null}
        width={850}
        destroyOnHidden
      >
        <div className="mb-4">
          <Input.Search
            placeholder="Masukkan No RM (Contoh: 00123456)..."
            enterButton="Cari Riwayat"
            size="large"
            value={mrSearchTerm}
            onChange={e => setMrSearchTerm(e.target.value)}
            onSearch={fetchHistoryByMr}
            loading={mrSearchLoading}
            autoFocus
          />
        </div>
        <Table
          dataSource={mrHistoryResults}
          loading={mrSearchLoading}
          rowKey="mut_no"
          pagination={false}
          size="small"
          scroll={{ y: 400 }}
          onRow={(record) => ({
            onClick: () => {
              handleSelectPatient(record);
              setIsMrSearchModalOpen(false);
            },
            className: 'cursor-pointer hover:bg-blue-50'
          })}
          columns={[
            { 
              title: 'No Register', 
              dataIndex: 'mut_no', 
              width: 130,
              render: (v) => <span className="font-mono font-bold text-blue-600">{v}</span>
            },
            { 
              title: 'Tgl Masuk', 
              dataIndex: 'tgl_masuk', 
              width: 150,
              render: d => dayjs(d).format('DD/MM/YYYY HH:mm') 
            },
            { title: 'No RM', dataIndex: 'mr_no', width: 100 },
            { title: 'Nama Pasien', dataIndex: 'nama' },
            { 
              title: 'Unit/Ruang', 
              dataIndex: 'nm_ruang',
              render: (v) => <Tag color="orange">{v}</Tag>
            },
            {
              title: 'Aksi',
              width: 80,
              align: 'center',
              render: (_, record) => (
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<ArrowRightOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPatient(record);
                    setIsMrSearchModalOpen(false);
                  }}
                >Pilih</Button>
              )
            }
          ]}
        />
      </Modal>

      {/* PPA Modal */}
      <Modal
        open={isPPAModalOpen}
        onCancel={() => { resetPPAModal(); setIsPPAModalOpen(false); }}
        footer={null}
        width={500}
        destroyOnHidden
        styles={{
          body: { padding: 0 },
          mask: { backdropFilter: 'blur(4px)' }
        }}
        closable={false}
      >
        <div className="overflow-hidden rounded-2xl">
          {/* Modal Header with Branding */}
          <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white relative">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                <SafetyCertificateOutlined className="text-2xl text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white m-0">Verifikasi Identitas</h3>
                <p className="text-xs text-indigo-100 opacity-90">Digital Signature & Authentication PPA</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
          </div>

          <div className="p-6 bg-white">
            {!changePwdMode ? (
              <div className="space-y-4">
                {/* Context Info */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Unit Aktif</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600">{ruangHD ? ruangHD.klinik_name : 'HEMODIALISA'}</span>
                </div>

                {/* Profesi Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Profesi Pengguna</label>
                  <Select
                    className="w-full custom-select-premium"
                    placeholder="Pilih Profesi Anda..."
                    size="large"
                    value={selectedProfesi}
                    onChange={val => setSelectedProfesi(val)}
                    options={Array.from(new Map(profesiList.filter(p => p.kd_profesi).map(p => [p.kd_profesi, { value: p.kd_profesi, label: p.nama_profesi }])).values())}
                    showSearch
                    prefix={<TeamOutlined className="text-slate-400" />}
                  />
                </div>

                {/* Pegawai Search */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Cari Nama Petugas</label>
                  <Input
                    placeholder="Masukkan Nama/NIK..."
                    size="large"
                    value={pegawaiSearchText}
                    onChange={e => {
                      setPegawaiSearchText(e.target.value);
                      setPegawaiHighlightIdx(-1);
                      if (selectedPegawai) setSelectedPegawai(null);
                    }}
                    onKeyDown={handlePegawaiSearchKeyDown}
                    onPressEnter={searchPegawai}
                    prefix={<SearchOutlined className="text-slate-400" />}
                    suffix={
                      <Button
                        size="small"
                        type="primary"
                        className="bg-indigo-600 rounded-md"
                        onClick={searchPegawai}
                        loading={ppaSearchLoading}
                      >
                        Cari
                      </Button>
                    }
                  />

                  {pegawaiSearchResults.length > 0 && !selectedPegawai && (
                    <div className="mt-2 border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                      <Table
                        size="small"
                        dataSource={pegawaiSearchResults}
                        rowKey="no"
                        pagination={false}
                        scroll={{ y: 150 }}
                        className="ppa-search-table"
                        onRow={(_record, idx) => ({ onClick: () => selectPegawaiAtIdx(idx) })}
                        rowClassName={(record, idx) => `
                          ${idx === pegawaiHighlightIdx ? 'bg-indigo-50' : ''}
                          ${selectedPegawai?.no === record.no ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}
                          cursor-pointer transition-colors
                        `}
                        columns={[
                          { title: 'NIK', dataIndex: 'no', width: 80, render: v => <span className="text-xs font-mono">{v}</span> },
                          { title: 'Nama Lengkap', dataIndex: 'nama', render: v => <span className="text-xs font-medium">{v}</span> },
                        ]}
                      />
                    </div>
                  )}
                </div>

                {selectedPegawai && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-1">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedPegawai.nama.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-indigo-500 font-bold uppercase m-0 leading-none mb-1">PPA Terpilih</p>
                      <p className="text-sm font-bold text-slate-800 m-0">{selectedPegawai.nama}</p>
                    </div>
                    <CheckCircleOutlined className="text-indigo-600 text-lg" />
                  </div>
                )}

                {/* Password field - disguised for extra security */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Password Keamanan</label>
                  <input type="text" style={{ display: 'none' }} autoComplete="username" readOnly />
                  <Input.Password
                    ref={passwordInputRef}
                    placeholder="Sandi Keamanan..."
                    size="large"
                    value={ppaPassword}
                    onChange={e => setPpaPassword(e.target.value)}
                    onPressEnter={handleSetPPA}
                    prefix={<LockOutlined className="text-slate-400" />}
                    autoComplete="new-password"
                    className="rounded-xl"
                  />
                  <p className="text-[9px] text-slate-400 px-1 mt-1">
                    <AlertOutlined className="mr-1" /> Password bersifat rahasia dan setara dengan tanda tangan basah.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button
                    block
                    size="large"
                    className="rounded-xl font-semibold border-slate-200"
                    onClick={() => { resetPPAModal(); setIsPPAModalOpen(false); }}
                  >
                    Batal
                  </Button>
                  <Button
                    type="primary"
                    block
                    size="large"
                    className="bg-gradient-to-r from-indigo-700 to-blue-600 rounded-xl font-bold shadow-lg shadow-indigo-200"
                    loading={ppaSubmitLoading}
                    onClick={handleSetPPA}
                  >
                    Verifikasi PPA
                  </Button>
                </div>

                <div className="pt-2 text-center border-t border-slate-50">
                  <Button
                    type="link"
                    size="small"
                    className="text-slate-400 hover:text-indigo-600 text-xs"
                    onClick={() => setChangePwdMode(true)}
                    disabled={!currentPPA}
                  >
                    Ganti Password Saya
                  </Button>
                </div>
              </div>
            ) : (
              /* Ubah Password Mode */
              <div className="pt-2">
                <div className="mb-4 px-3 py-2 bg-indigo-50 rounded-lg text-sm text-indigo-800 font-medium flex items-center gap-2">
                  <UserOutlined />
                  PPA Aktif: {currentPPA?.nama} ({currentPPA?.nama_profesi})
                </div>
                {/* Input dummy tersembunyi agar browser tidak kenali sebagai form login */}
                <input type="text" style={{ display: 'none' }} autoComplete="username" readOnly />
                <Form
                  form={changePwdForm}
                  layout="vertical"
                  onFinish={handleChangePassword}
                  autoComplete="off"
                >
                  <Form.Item
                    label="Password Lama"
                    name="old_password"
                    rules={[{ required: true, message: 'Masukkan password lama' }]}
                  >
                    <Input.Password placeholder="Password lama..." autoComplete="new-password" />
                  </Form.Item>
                  <Form.Item
                    label="Password Baru"
                    name="new_password"
                    rules={[{ required: true, message: 'Masukkan password baru' }, { min: 5, message: 'Minimal 5 karakter' }]}
                  >
                    <Input.Password placeholder="Password baru..." autoComplete="new-password" />
                  </Form.Item>
                  <Form.Item
                    label="Konfirmasi Password Baru"
                    name="confirm_password"
                    dependencies={['new_password']}
                    rules={[
                      { required: true, message: 'Konfirmasi password baru' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                          return Promise.reject(new Error('Password tidak cocok'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="Ulangi password baru..." autoComplete="new-password" />
                  </Form.Item>
                  <div className="flex justify-between pt-1">
                    <Button onClick={() => setChangePwdMode(false)}>
                      Kembali
                    </Button>
                    <Button type="primary" htmlType="submit" icon={<LockOutlined />}>
                      Simpan Password
                    </Button>
                  </div>
                </Form>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardHD;
