import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Table, Tabs, Tag, Skeleton, Descriptions, Form, Modal, App, Select, Divider, Badge, Checkbox, Radio, Space, List, DatePicker, TimePicker, Popconfirm } from 'antd';
import { SearchOutlined, UserOutlined, FileTextOutlined, LineChartOutlined, AlertOutlined, HistoryOutlined, HomeOutlined, MedicineBoxOutlined, EyeOutlined, TeamOutlined, LockOutlined, UnorderedListOutlined, CopyOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const API_BASE = 'http://localhost/erm/api/public/index.php/api/hd';

const DashboardHD = () => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const [cpptData, setCpptData] = useState([]);
  const [ewsData, setEwsData] = useState([]);
  const [codeBlueData, setCodeBlueData] = useState([]);
  const [ewsForm] = Form.useForm();
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

  // Template SOAP state
  const [templateVisible, setTemplateVisible] = useState(false);
  const [templateType, setTemplateType] = useState(null);
  const [templateList, setTemplateList] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);

  // Copy SOAP state
  const [copySOAPVisible, setCopySOAPVisible] = useState(false);
  const [copySOAPSource, setCopySOAPSource] = useState(null);
  const [copySOAPParts, setCopySOAPParts] = useState(['S', 'O', 'A', 'P']);

  useEffect(() => {
    fetchPatientsToday();
    fetchProfesi();
    fetchRuangHD();

    const handleOpenSearch = () => setIsSearchModalOpen(true);
    const handleOpenPPA = () => setIsPPAModalOpen(true);
    window.addEventListener('open-patient-search', handleOpenSearch);
    window.addEventListener('open-ppa-modal', handleOpenPPA);
    return () => {
      window.removeEventListener('open-patient-search', handleOpenSearch);
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

  const handleSelectPatient = async (patient) => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API_BASE}/detail/${patient.mut_no}`);
      setSelectedPatient(resp.data);
      setIsSearchModalOpen(false);
      
      // Load tabs data
      fetchTabData(patient.mut_no, resp.data.mr_no);
    } catch (error) {
      console.error(error);
      message.error("Gagal mengambil detail pasien");
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async (mutNo, mrNo) => {
    try {
      const [ews, cb, cppt] = await Promise.all([
        axios.get(`${API_BASE}/ews/${mutNo}`),
        axios.get(`${API_BASE}/code-blue/${mutNo}`),
        axios.get(`${API_BASE}/cppt/${mrNo}`)
      ]);
      setEwsData(ews.data);
      setCodeBlueData(cb.data);
      setCpptData(cppt.data);
    } catch (error) {
      console.error(error);
    }
  };

  const onFinishSoap = async (values) => {
    setLoading(true);
    try {
      // Gabungkan field extra ke dalam teks objektif
      const hdExtra = [];
      if (values.bb_kering)          hdExtra.push(`BB Kering: ${values.bb_kering} kg`);
      if (values.bb_post_hd_sblmnya) hdExtra.push(`BB Post HD Sblmnya: ${values.bb_post_hd_sblmnya} kg`);
      if (values.tindakan_hd_ke)     hdExtra.push(`HD Ke: ${values.tindakan_hd_ke}`);
      if (values.akses_vaskuler)     hdExtra.push(`Akses Vaskuler: ${values.akses_vaskuler}`);
      if (values.tanda_infeksi)      hdExtra.push(`Tanda Infeksi: ${values.tanda_infeksi}`);
      if (values.egfr)               hdExtra.push(`eGFR: ${values.egfr}`);

      const objektifFinal = [
        values.objektif || '',
        hdExtra.length ? `\n[${hdExtra.join(' | ')}]` : '',
      ].join('').trim();

      await axios.post(`${API_BASE}/soap`, {
        mut_no: selectedPatient.mut_no,
        id_petugas: currentPPA?.no ?? null,
        soap_jns: currentPPA?.kd_profesi ?? null,
        subjektif: values.subjektif || null,
        objektif: objektifFinal || null,
        assesment: values.assesment || null,
        plan: values.plan || null,
        // Kolom dedicated
        suhu: values.suhu || null,
        nadi: values.nadi || null,
        tensi: values.tensi || null,
        rr: values.rr || null,
        spo2: values.spo2 || null,
        tb: values.tb || null,
        bb: values.bb_pre_hd || null,
        adekuasi_cairan: values.adekuasi_cairan || null,
      });
      message.success('SOAP berhasil disimpan');
      form.resetFields();
      await fetchTabData(selectedPatient.mut_no, selectedPatient.mr_no);
    } catch (error) {
      console.error(error);
      message.error('Gagal menyimpan SOAP');
    } finally {
      setLoading(false);
    }
  };

  const openTemplateModal = async (tipe) => {
    setTemplateType(tipe);
    setTemplateList([]);
    setTemplateVisible(true);
    setTemplateLoading(true);
    try {
      const resp = await axios.get(`${API_BASE}/template-soap?tipe=${tipe}&kd_ruang=617`);
      setTemplateList(resp.data || []);
    } catch (e) {
      message.error('Gagal mengambil template');
    } finally {
      setTemplateLoading(false);
    }
  };

  const applyTemplate = (item) => {
    const fieldMap = { S: 'subjektif', O: 'objektif', A: 'assesment', P: 'plan' };
    const field = fieldMap[templateType];
    const current = form.getFieldValue(field) || '';
    form.setFieldsValue({ [field]: current ? `${current}\n${item.name}` : item.name });
    setTemplateVisible(false);
  };

  const handleCopySOAP = () => {
    if (!copySOAPSource) { message.warning('Pilih data SOAP yang akan dicopy'); return; }
    const fieldMap = { S: 'subjektif', O: 'objektif', A: 'assesment', P: 'plan' };
    const updates = {};
    if (copySOAPParts.includes('S')) updates.subjektif  = copySOAPSource.subjektif  || '';
    if (copySOAPParts.includes('O')) updates.objektif   = copySOAPSource.objektif   || '';
    if (copySOAPParts.includes('A')) updates.assesment  = copySOAPSource.assesment  || '';
    if (copySOAPParts.includes('P')) updates.plan       = copySOAPSource.plan       || '';
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
    setShowEwsForm(true);
  };

  const handleDeleteEws = async (id_item) => {
    Modal.confirm({
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
      const totalSkor = Object.values(ewsParameters).reduce((a, b) => a + b, 0);
      let kategori = 'Risiko Rendah';
      if (totalSkor > 4) {
        kategori = 'Risiko Tinggi';
      } else if (totalSkor > 2) {
        kategori = 'Risiko Sedang';
      }
      
      const data = {
        mut_no: selectedPatient.mut_no,
        mr_no: selectedPatient.mr_no,
        ...ewsParameters,
        total_skor: totalSkor,
        kategori: kategori,
        tgl_jam: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        id_petugas: currentPPA?.no ?? null,
      };

      if (editingEws) {
        // Update
        await axios.put(`${API_BASE}/ews/${editingEws.id_item}`, data);
        message.success("EWS berhasil diperbarui");
      } else {
        // Create
        await axios.post(`${API_BASE}/ews`, data);
        message.success("EWS berhasil disimpan");
      }

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
    } catch (error) {
      console.error(error);
      message.error(editingEws ? "Gagal memperbarui EWS" : "Gagal menyimpan EWS");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'No RM', dataIndex: 'mr_no' },
    { title: 'Nama', dataIndex: 'nama' },
    { title: 'L/P', dataIndex: 'jenis' },
    { title: 'Ruang', dataIndex: 'nm_ruang' },
    {
      title: 'Action',
      render: (_, record) => (
        <Button onClick={() => handleSelectPatient(record)} type="link">Pilih</Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Search Section - MOVED TO HEADER, adding breadcrumb/title instead */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {selectedPatient ? `Monitoring: ${selectedPatient.nama}` : 'Hemodialisa Monitoring'}
          </h1>
          {currentPPA && (
            <div className="flex items-center gap-2 mt-1">
              <Badge status="processing" />
              <span className="text-sm text-gray-600">
                PPA Aktif: <span className="font-semibold text-indigo-700">{currentPPA.nama}</span>
                <span className="ml-1 text-xs text-gray-500">({currentPPA.nama_profesi})</span>
              </span>
            </div>
          )}
        </div>
        {selectedPatient && (
          <Button
            onClick={() => setSelectedPatient(null)}
            size="small"
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white border-none rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 w-full sm:w-auto"
            icon={<HomeOutlined />}
          >
            <span className="font-medium">Back to Dashboard</span>
          </Button>
        )}
      </div>

      {!selectedPatient ? (
        <>
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-indigo-100 text-sm">Total Pasien HD</p>
                  <h3 className="text-3xl font-bold mt-1">{patients.length}</h3>
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
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">12</h3>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <HistoryOutlined className="text-xl text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                 <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '60%' }}></div>
                 </div>
                 <span className="text-xs text-gray-400">60%</span>
              </div>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">Selesai</p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-800">8</h3>
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                  <Tag color="success" className="m-0 border-none px-0"><LineChartOutlined className="text-xl" /></Tag>
                </div>
              </div>
              <div className="mt-4 text-xs text-green-500 font-medium">+2 dari kemarin</div>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
              <p className="text-gray-500 text-sm mb-2">Trend 7 Hari</p>
              <div className="h-24 flex items-end gap-1.5 px-1">
                 {[30, 45, 25, 60, 40, 50, 75].map((h, i) => (
                   <div 
                     key={i} 
                     className="flex-1 bg-indigo-500 rounded-t-md transition-all hover:bg-indigo-400" 
                     style={{ height: `${h}%` }}
                     title={`Hari ${i+1}`}
                   ></div>
                 ))}
              </div>
              <div className="mt-2 flex justify-between px-1 text-[10px] text-gray-400 font-mono">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
            </Card>
          </div>

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
        <>
          {/* Patient Header (Modern Gradient Design) */}
          <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-3xl shadow-lg border border-white/50 overflow-hidden mb-6 transform transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
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
                      {selectedPatient.jenis === 'L' ? 'Laki-laki' : 'Perempuan'}, {dayjs().diff(dayjs(selectedPatient.tgl_lahir), 'year')} tahun
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
          <div className="bg-white p-6 rounded-2xl shadow-sm min-h-[500px]">
            <Tabs
              defaultActiveKey="1"
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
                              <h2 className="text-3xl font-bold text-indigo-700">1.4</h2>
                              <div className="flex-1 h-3 bg-white rounded-full overflow-hidden border border-indigo-100">
                                 <div className="h-full bg-green-500" style={{ width: '80%' }}></div>
                              </div>
                              <Tag color="success">TARGET CAPAI</Tag>
                           </div>
                           <p className="text-[10px] text-indigo-400 mt-2">*Berdasarkan rumus Daugirdas II (Target &gt; 1.2)</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                           <h4 className="text-orange-900 font-semibold mb-2">Ulor / Penarikan Cairan</h4>
                           <div className="flex items-center gap-4">
                              <h2 className="text-3xl font-bold text-orange-700">2.5<span className="text-sm font-normal">L</span></h2>
                              <div className="text-xs text-orange-600">BB Pre: 65kg <br/> BB Post: 62.5kg</div>
                           </div>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <HistoryOutlined /> Riwayat Tindakan Terakhir
                      </h3>
                      <Table size="small" pagination={false} 
                        rowKey="tgl"
                        dataSource={[
                        { tgl: '12 Apr 2026', dx: 'CKD Stage V', act: 'HD 4 Jam' },
                        { tgl: '08 Apr 2026', dx: 'CKD Stage V', act: 'HD 4 Jam' },
                      ]} columns={[
                        {title: 'Tanggal', dataIndex: 'tgl'},
                        {title: 'Diagnosa', dataIndex: 'dx'},
                        {title: 'Tindakan', dataIndex: 'act'}
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
                        dataSource={cpptData} 
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
                                switch(code) {
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
                                    <div className="text-sm font-semibold text-slate-900">{record.subjektif || '-'}</div>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Tag color="green" size="small" className="text-[10px]">O</Tag>
                                  <div className="space-y-2">
                                    <div className="text-sm font-semibold text-slate-900">{record.objektif || '-'}</div>
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
                                  <span className="text-sm font-medium">{text || '-'}</span>
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
                                  <span className="text-sm font-medium">{text || '-'}</span>
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
                                switch(String(type)) {
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
                            width: 100,
                            align: 'center',
                            render: (_, record) => (
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
                                                // Jika sudah berupa nama profesi langsung, tampilkan apa adanya
                                                if (typeof code === 'string' && isNaN(code)) {
                                                  return code;
                                                }
                                                // Jika berupa kode angka, mapping ke nama profesi
                                                switch(code) {
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
                                            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">{record.subjektif || '-'}</p>
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-gray-800 mb-2">Objektif</h4>
                                            <p className="text-sm text-gray-600 bg-green-50 p-3 rounded">{record.objektif || '-'}</p>
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-gray-800 mb-2">Assessment</h4>
                                            <p className="text-sm text-gray-600 bg-orange-50 p-3 rounded">{record.assesment || '-'}</p>
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-gray-800 mb-2">Plan</h4>
                                            <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded">{record.plan || '-'}</p>
                                          </div>
                                          {record.implementation && (
                                            <div>
                                              <h4 className="font-semibold text-gray-800 mb-2">Implementation</h4>
                                              <p className="text-sm text-gray-600 bg-indigo-50 p-3 rounded">{record.implementation}</p>
                                            </div>
                                          )}
                                          {record.evaluation && (
                                            <div>
                                              <h4 className="font-semibold text-gray-800 mb-2">Evaluation</h4>
                                              <p className="text-sm text-gray-600 bg-pink-50 p-3 rounded">{record.evaluation}</p>
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
                            )
                          }
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: '3',
                  label: <span><FileTextOutlined /> SOAP</span>,
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

                          {/* ── Tanda Vital & Data HD ── */}
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tanda Vital &amp; Data HD</p>
                            {/* Baris 1 — kolom dedicated */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-3 gap-y-0">
                              <Form.Item label="Suhu (°C)" name="suhu" className="mb-2"><Input placeholder="36.5" /></Form.Item>
                              <Form.Item label="Nadi (x/mnt)" name="nadi" className="mb-2"><Input placeholder="80" /></Form.Item>
                              <Form.Item label="Tensi (mmHg)" name="tensi" className="mb-2"><Input placeholder="120/80" /></Form.Item>
                              <Form.Item label="RR (x/mnt)" name="rr" className="mb-2"><Input placeholder="18" /></Form.Item>
                              <Form.Item label="SPO2 (%)" name="spo2" className="mb-2"><Input placeholder="98" /></Form.Item>
                              <Form.Item label="BB Pre HD (kg)" name="bb_pre_hd" className="mb-2"><Input placeholder="64" /></Form.Item>
                              <Form.Item label="TB (cm)" name="tb" className="mb-2"><Input placeholder="165" /></Form.Item>
                              <Form.Item label="Adekuasi Cairan" name="adekuasi_cairan" className="mb-2"><Input placeholder="mL" /></Form.Item>
                            </div>
                            {/* Baris 2 — masuk ke objektif jika diisi */}
                            {/* <p className="text-[10px] text-gray-400 italic mb-2">Field berikut jika diisi akan otomatis disertakan dalam teks Objektif</p> */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-0">
                              <Form.Item label="BB Kering (kg)" name="bb_kering" className="mb-2"><Input placeholder="60" /></Form.Item>
                              <Form.Item label="BB Post HD Sblmnya" name="bb_post_hd_sblmnya" className="mb-2"><Input placeholder="62" /></Form.Item>
                              <Form.Item label="Tindakan HD Ke" name="tindakan_hd_ke" className="mb-2"><Input placeholder="1" /></Form.Item>
                              <Form.Item label="eGFR (mL/min/1.73m²)" name="egfr" className="mb-2"><Input placeholder="12.5" /></Form.Item>
                              <Form.Item label="Akses Vaskuler" name="akses_vaskuler" className="mb-2">
                                <Select placeholder="Pilih..." allowClear options={[
                                  { value: 'AVF', label: 'AVF' },
                                  { value: 'AVG', label: 'AVG (Graft)' },
                                  { value: 'CVC Temporer', label: 'CVC Temporer' },
                                  { value: 'CVC Permanen', label: 'CVC Permanen' },
                                ]} />
                              </Form.Item>
                              <Form.Item label="Tanda Infeksi" name="tanda_infeksi" className="mb-2">
                                <Select placeholder="Pilih..." allowClear options={[
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item
                              label={<div className="flex items-center gap-2"><span className="font-bold text-blue-700">Subjektif (S)</span>{templateBtn('S','blue')}</div>}
                              name="subjektif" rules={[{ required: true, message: 'Subjektif wajib diisi' }]} className="mb-0"
                            >
                              <Input.TextArea rows={5} placeholder="Keluhan yang dirasakan pasien..." />
                            </Form.Item>
                            <Form.Item
                              label={<div className="flex items-center gap-2"><span className="font-bold text-green-700">Objektif (O)</span>{templateBtn('O','green')}</div>}
                              name="objektif" className="mb-0"
                            >
                              <Input.TextArea rows={5} placeholder="Hasil pemeriksaan fisik, observasi..." />
                            </Form.Item>
                            <Form.Item
                              label={<div className="flex items-center gap-2"><span className="font-bold text-orange-700">Asesmen (A)</span>{templateBtn('A','orange')}</div>}
                              name="assesment" className="mb-0"
                            >
                              <Input.TextArea rows={5} placeholder="Analisa / diagnosa keperawatan..." />
                            </Form.Item>
                            <Form.Item
                              label={<div className="flex items-center gap-2"><span className="font-bold text-purple-700">Plan (P)</span>{templateBtn('P','purple')}</div>}
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
                              { title: 'Subjektif', dataIndex: 'subjektif', width: 180, render: v => <span className="text-xs line-clamp-2">{v || '-'}</span> },
                              { title: 'Objektif',  dataIndex: 'objektif',  width: 180, render: v => <span className="text-xs line-clamp-2">{v || '-'}</span> },
                              { title: 'Asesmen',   dataIndex: 'assesment', width: 180, render: v => <span className="text-xs line-clamp-2">{v || '-'}</span> },
                              { title: 'Plan',      dataIndex: 'plan',      width: 180, render: v => <span className="text-xs line-clamp-2">{v || '-'}</span> },
                              {
                                title: 'Pelaksana', dataIndex: 'nama_petugas', width: 120,
                                render: (v, r) => <div className="text-xs"><div className="font-medium">{v || '-'}</div><div className="text-gray-400">{r.nama_profesi || '-'}</div></div>,
                              },
                            ]}
                          />
                        </div>
                      </div>
                    );
                  })(),
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
                          columns={[
                            {
                              title: 'Tanggal / Jam',
                              dataIndex: 'tgl_jam',
                              width: 140,
                              render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
                            },
                            {title: 'Kesadaran', dataIndex: 'kesadaran', render: (s) => <Tag color="blue">{s}</Tag>},
                            {title: 'Suhu', dataIndex: 'suhu', render: (s) => <Tag color="orange">{s}</Tag>},
                            {title: 'Tekanan', dataIndex: 'tekanan_sistolik', render: (s) => <Tag color="red">{s}</Tag>},
                            {title: 'Nadi', dataIndex: 'denyut_nadi', render: (s) => <Tag color="violet">{s}</Tag>},
                            {title: 'Respirasi', dataIndex: 'respirasi', render: (s) => <Tag color="green">{s}</Tag>},
                            {title: 'SpO₂', dataIndex: 'saturasi_oksigen', render: (s) => <Tag color="cyan">{s}</Tag>},
                            {
                              title: 'Skor',
                              render: (_, record) => {
                                const total = (record.kesadaran || 0) + (record.suhu || 0) + (record.tekanan_sistolik || 0) + 
                                             (record.denyut_nadi || 0) + (record.respirasi || 0) + (record.saturasi_oksigen || 0);
                                return <Tag color={total > 4 ? 'red' : total > 2 ? 'orange' : 'green'}>{total}</Tag>;
                              }
                            },
                            {
                              title: 'Kategori',
                              dataIndex: 'kategori',
                              render: (k) => {
                                if (k === 'Risiko Tinggi') return <Tag color="red">{k}</Tag>;
                                if (k === 'Risiko Sedang') return <Tag color="orange">{k}</Tag>;
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

                      {showEwsForm && (
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                          <h3 className="text-lg font-bold text-blue-900 mb-6">
                            {editingEws ? 'Edit Early Warning System (EWS)' : 'Input Early Warning System (EWS)'}
                          </h3>
                          <Form form={ewsForm} layout="vertical" onFinish={onFinishEws}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* KESADARAN */}
                              <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <label className="block font-semibold text-sm mb-3 text-gray-800">Kesadaran</label>
                                <div className="flex flex-wrap gap-1 sm:gap-2">
                                  {[0, 1, 2, 3].map(score => (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => setEwsParameters({...ewsParameters, kesadaran: score})}
                                      className={`px-2 sm:px-4 py-2 rounded font-semibold text-xs sm:text-sm ${
                                        ewsParameters.kesadaran === score
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      }`}
                                    >
                                      {score}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-600 mt-2">0=Alert, 1=Verbal, 2=Pain, 3=Unresponsive</p>
                              </div>

                              {/* SUHU */}
                              <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <label className="block font-semibold text-sm mb-3 text-gray-800">Suhu (°C)</label>
                                <div className="flex flex-wrap gap-1 sm:gap-2">
                                  {[0, 1, 2, 3].map(score => (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => setEwsParameters({...ewsParameters, suhu: score})}
                                      className={`px-2 sm:px-4 py-2 rounded font-semibold text-xs sm:text-sm ${
                                        ewsParameters.suhu === score
                                          ? 'bg-orange-600 text-white'
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      }`}
                                    >
                                      {score}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-600 mt-2">0=36-38, 1=≤35 atau ≥38.6, 2=35.1-36, 3=≥39</p>
                              </div>

                              {/* TEKANAN SISTOLIK */}
                              <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <label className="block font-semibold text-sm mb-3 text-gray-800">Tekanan Sistolik (mmHg)</label>
                                <div className="flex gap-2">
                                  {[0, 1, 2, 3].map(score => (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => setEwsParameters({...ewsParameters, tekanan_sistolik: score})}
                                      className={`px-4 py-2 rounded font-semibold text-sm ${
                                        ewsParameters.tekanan_sistolik === score
                                          ? 'bg-red-600 text-white'
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      }`}
                                    >
                                      {score}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-600 mt-2">0=111-219, 1=≤100 atau ≥220, 2=101-110, 3=≤90 atau ≥230</p>
                              </div>

                              {/* DENYUT NADI */}
                              <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <label className="block font-semibold text-sm mb-3 text-gray-800">Denyut Nadi (x/min)</label>
                                <div className="flex gap-2">
                                  {[0, 1, 2, 3].map(score => (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => setEwsParameters({...ewsParameters, denyut_nadi: score})}
                                      className={`px-4 py-2 rounded font-semibold text-sm ${
                                        ewsParameters.denyut_nadi === score
                                          ? 'bg-violet-600 text-white'
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      }`}
                                    >
                                      {score}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-600 mt-2">0=51-100, 1=41-50 atau 101-110, 2=111-130, 3=≤40 atau ≥131</p>
                              </div>

                              {/* RESPIRASI */}
                              <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <label className="block font-semibold text-sm mb-3 text-gray-800">Respirasi (x/min)</label>
                                <div className="flex gap-2">
                                  {[0, 1, 2, 3].map(score => (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => setEwsParameters({...ewsParameters, respirasi: score})}
                                      className={`px-4 py-2 rounded font-semibold text-sm ${
                                        ewsParameters.respirasi === score
                                          ? 'bg-green-600 text-white'
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      }`}
                                    >
                                      {score}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-600 mt-2">0=12-20, 1=9-11 atau 21-24, 2=≤8 atau ≥25, 3=-</p>
                              </div>

                              {/* SATURASI OKSIGEN */}
                              <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <label className="block font-semibold text-sm mb-3 text-gray-800">Saturasi Oksigen (%)</label>
                                <div className="flex gap-2">
                                  {[0, 1, 2, 3].map(score => (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => setEwsParameters({...ewsParameters, saturasi_oksigen: score})}
                                      className={`px-4 py-2 rounded font-semibold text-sm ${
                                        ewsParameters.saturasi_oksigen === score
                                          ? 'bg-cyan-600 text-white'
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      }`}
                                    >
                                      {score}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-600 mt-2">0=≥95, 1=94, 2=92-93, 3=≤91</p>
                              </div>
                            </div>

                            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-blue-300">
                              <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                  <div className="text-sm font-semibold text-gray-600">Total Skor</div>
                                  <div className="text-3xl font-bold text-blue-600 mt-2">
                                    {Object.values(ewsParameters).reduce((a, b) => a + b, 0)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-600">Kategori Risiko</div>
                                  <div className={`text-lg font-bold mt-2 px-3 py-2 rounded ${
                                    Object.values(ewsParameters).reduce((a, b) => a + b, 0) > 4 ? 'bg-red-100 text-red-700' :
                                    Object.values(ewsParameters).reduce((a, b) => a + b, 0) > 2 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {
                                      Object.values(ewsParameters).reduce((a, b) => a + b, 0) > 4 ? 'Risiko Tinggi' :
                                      Object.values(ewsParameters).reduce((a, b) => a + b, 0) > 2 ? 'Risiko Sedang' :
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
                      )}
                    </div>
                  ),
                },
                {
                  key: '5',
                  label: <span><AlertOutlined /> Code Blue</span>,
                  children: (
                    <Table 
                      dataSource={codeBlueData} 
                      rowKey="code_blue_no"
                      columns={[
                        {title: 'Waktu', dataIndex: 'tgl_periksa'},
                        {title: 'Diagnosa', dataIndex: 'diagnosa'},
                        {title: 'Asesmen', dataIndex: 'pm_asesment'}
                      ]} 
                    />
                  ),
                },
              ]}
            />
          </div>
        </>
      )}

      {/* Template SOAP Modal */}
      <Modal
        title={`Template ${templateType === 'S' ? 'Subjektif' : templateType === 'O' ? 'Objektif' : templateType === 'A' ? 'Asesmen' : 'Plan'}`}
        open={templateVisible}
        onCancel={() => setTemplateVisible(false)}
        footer={null}
        width={480}
      >
        {templateLoading ? (
          <div className="py-8 text-center text-gray-400">Memuat template...</div>
        ) : templateList.length === 0 ? (
          <div className="py-8 text-center text-gray-400">Tidak ada template tersedia</div>
        ) : (
          <List
            size="small"
            dataSource={templateList}
            renderItem={item => (
              <List.Item
                className="cursor-pointer hover:bg-indigo-50 rounded px-2 transition-colors"
                onClick={() => applyTemplate(item)}
              >
                <span className="text-sm">{item.name}</span>
              </List.Item>
            )}
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
                    { label: 'Objektif (O)',  value: 'O' },
                    { label: 'Asesmen (A)',   value: 'A' },
                    { label: 'Plan (P)',      value: 'P' },
                  ]}
                />
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Search Modal */}
      <Modal
        title="Daftar Pasien Hari Ini"
        open={isSearchModalOpen}
        onCancel={() => setIsSearchModalOpen(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={patients}
          columns={columns}
          loading={loading}
          rowKey="mut_no"
          pagination={{ pageSize: 5 }}
        />
      </Modal>

      {/* PPA Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <TeamOutlined className="text-indigo-600" />
            <span>Ganti PPA (Profesional Pemberi Asuhan)</span>
          </div>
        }
        open={isPPAModalOpen}
        onCancel={() => { resetPPAModal(); setIsPPAModalOpen(false); }}
        footer={null}
        width={600}
        destroyOnHidden
      >
        {!changePwdMode ? (
          <div className="space-y-5 pt-2">
            {/* Ruang — hardcoded HD */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ruang</label>
              <Input
                value={ruangHD ? `${ruangHD.klinik_name} (${ruangHD.kd_ruang})` : 'Memuat...'}
                disabled
                className="bg-indigo-50"
              />
            </div>

            {/* Profesi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Profesi</label>
              <Select
                className="w-full"
                placeholder="Pilih profesi..."
                value={selectedProfesi}
                onChange={val => setSelectedProfesi(val)}
                options={profesiList.map(p => ({ value: p.kd_profesi, label: p.nama_profesi }))}
                showSearch
              />
            </div>

            {/* Cari Pegawai */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Petugas</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ketik nama petugas..."
                  value={pegawaiSearchText}
                  onChange={e => { setPegawaiSearchText(e.target.value); setPegawaiHighlightIdx(-1); }}
                  onPressEnter={pegawaiSearchResults.length > 0 ? undefined : searchPegawai}
                  onKeyDown={handlePegawaiSearchKeyDown}
                />
                <Button onClick={searchPegawai} loading={ppaSearchLoading} type="default">
                  Cari
                </Button>
              </div>
              {pegawaiSearchResults.length > 0 && (
                <Table
                  className="mt-2"
                  size="small"
                  dataSource={pegawaiSearchResults}
                  rowKey="no"
                  pagination={false}
                  scroll={{ y: 180 }}
                  rowClassName={(record, idx) => {
                    if (idx === pegawaiHighlightIdx) return 'bg-indigo-100 cursor-pointer';
                    if (selectedPegawai?.no === record.no) return 'bg-indigo-50 cursor-pointer';
                    return 'cursor-pointer hover:bg-gray-50';
                  }}
                  onRow={(_record, idx) => ({ onClick: () => selectPegawaiAtIdx(idx) })}
                  columns={[
                    { title: 'No', dataIndex: 'no', width: 70 },
                    { title: 'Nama', dataIndex: 'nama' },
                  ]}
                />
              )}
              {selectedPegawai && (
                <div className="mt-2 px-3 py-2 bg-indigo-50 rounded-lg text-sm text-indigo-800 font-medium flex items-center gap-2">
                  <UserOutlined />
                  Terpilih: {selectedPegawai.nama}
                </div>
              )}
            </div>

            {/* Password — autoComplete=new-password mencegah browser tawarkan simpan password */}
            {/* Input dummy tersembunyi agar browser tidak kenali ini sebagai form login */}
            <input type="text" style={{ display: 'none' }} autoComplete="username" readOnly />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <Input.Password
                ref={passwordInputRef}
                placeholder="Masukkan password..."
                value={ppaPassword}
                onChange={e => setPpaPassword(e.target.value)}
                onPressEnter={handleSetPPA}
                autoComplete="new-password"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                icon={<LockOutlined />}
                onClick={() => setChangePwdMode(true)}
                disabled={!currentPPA}
                size="small"
              >
                Ubah Password PPA
              </Button>
              <div className="flex gap-2">
                <Button onClick={() => { resetPPAModal(); setIsPPAModalOpen(false); }}>
                  Batal
                </Button>
                <Button
                  type="primary"
                  onClick={handleSetPPA}
                  loading={ppaSubmitLoading}
                  icon={<TeamOutlined />}
                >
                  Set PPA
                </Button>
              </div>
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
      </Modal>
    </div>
  );
};

export default DashboardHD;
