import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Modal, Form, Input, Select, Tag, Space, Row, Col, Divider, App } from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined, LockOutlined, GlobalOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

import API_BASE from '../config';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [editingUser, setEditingUser] = useState(null);
    const { message } = App.useApp();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const resp = await axios.get(`${API_BASE}/users`);
            setUsers(resp.data);
        } catch (e) {
            message.error('Gagal mengambil data user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const showModal = (user = null) => {
        setEditingUser(user);
        if (user) {
            form.setFieldsValue({
                id: user.id,
                username: user.user_nama,
                nama: user.user_real_nama,
                role: user.user_role,
                privileges: user.privileges
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ role: 'user', privileges: { hd: 'none', ibs: 'none', igd: 'none', ranap: 'none' } });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (values) => {
        try {
            const resp = await axios.post(`${API_BASE}/users`, {
                ...values,
                id: editingUser?.id
            });
            if (resp.data.success) {
                message.success('User berhasil disimpan');
                setIsModalOpen(false);
                fetchUsers();
            }
        } catch (e) {
            message.error('Gagal menyimpan user');
        }
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Hapus User',
            content: 'Apakah Anda yakin ingin menghapus user ini?',
            okText: 'Hapus',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: async () => {
                try {
                    await axios.delete(`${API_BASE}/users/${id}`);
                    message.success('User berhasil dihapus');
                    fetchUsers();
                } catch (e) {
                    message.error('Gagal menghapus user');
                }
            }
        });
    };

    const columns = [
        {
            title: 'Username',
            dataIndex: 'user_nama',
            key: 'user_nama',
            render: (text) => <span className="font-bold text-indigo-700">{text}</span>
        },
        {
            title: 'Nama Lengkap',
            dataIndex: 'user_real_nama',
            key: 'user_real_nama'
        },
        {
            title: 'Role',
            dataIndex: 'user_role',
            key: 'user_role',
            render: (role) => (
                <Tag color={role === 'admin' ? 'purple' : 'blue'} className="rounded-md uppercase px-3 font-bold">
                    {role}
                </Tag>
            )
        },
        {
            title: 'Module Access',
            key: 'privileges',
            render: (_, record) => (
                <Space wrap>
                    {Object.entries(record.privileges || {}).map(([mod, priv]) => (
                        priv !== 'none' && (
                            <Tag key={mod} color={priv === 'rw' ? 'green' : 'orange'} className="rounded-lg text-[10px] font-bold">
                                {mod.toUpperCase()}: {priv === 'rw' ? 'RW' : 'READ'}
                            </Tag>
                        )
                    ))}
                </Space>
            )
        },
        {
            title: 'Aksi',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => showModal(record)} size="small" />
                    <Button icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} danger size="small" />
                </Space>
            )
        }
    ];

    return (
        <div className="p-2">
            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Card 
                        className="rounded-2xl border-none shadow-sm"
                        title={
                            <span className="text-xl font-bold flex items-center gap-2">
                                <SafetyCertificateOutlined className="text-indigo-600" /> Manajemen Akun & Hak Akses
                            </span>
                        }
                        extra={
                            <Button 
                                type="primary" 
                                icon={<UserAddOutlined />} 
                                onClick={() => showModal()}
                                className="bg-indigo-600 rounded-xl"
                            >
                                Tambah User Baru
                            </Button>
                        }
                    >
                        <Table 
                            dataSource={users} 
                            columns={columns} 
                            rowKey="id" 
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                            className="custom-table"
                        />
                    </Card>
                </Col>
            </Row>

            <Modal
                title={
                    <span className="flex items-center gap-2 font-bold text-indigo-700">
                        {editingUser ? <EditOutlined /> : <UserAddOutlined />}
                        {editingUser ? 'Edit User' : 'Tambah User Baru'}
                    </span>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={650}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    className="mt-4"
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Username" name="username" rules={[{ required: true }]}>
                                <Input prefix={<UserOutlined />} placeholder="Contoh: perawat01" className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Role" name="role" rules={[{ required: true }]}>
                                <Select className="w-full">
                                    <Select.Option value="user">User Standar</Select.Option>
                                    <Select.Option value="admin">Administrator Sistem</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item label="Nama Lengkap" name="nama" rules={[{ required: true }]}>
                                <Input placeholder="Nama lengkap petugas..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item 
                                label={editingUser ? "Ganti Password (Kosongkan jika tidak diubah)" : "Password"} 
                                name="password" 
                                rules={[{ required: !editingUser }]}
                            >
                                <Input.Password prefix={<LockOutlined />} className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider titlePlacement="left" className="m-0 mb-4 font-bold text-slate-400 text-xs tracking-widest uppercase">
                        Hak Akses Modul (Module Privileges)
                    </Divider>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                        <Row gutter={[16, 16]}>
                            {['hd', 'ibs', 'igd', 'ranap'].map((module) => (
                                <Col span={12} key={module}>
                                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                                        <span className="font-bold text-slate-700 capitalize flex items-center gap-2">
                                            <GlobalOutlined className="text-indigo-400 text-xs" /> {module.toUpperCase()}
                                        </span>
                                        <Form.Item name={['privileges', module]} noStyle initialValue="none">
                                            <Select size="small" style={{ width: 100 }} className="text-xs">
                                                <Select.Option value="none">Kosong</Select.Option>
                                                <Select.Option value="r">Read Only</Select.Option>
                                                <Select.Option value="rw">Read Write</Select.Option>
                                            </Select>
                                        </Form.Item>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button onClick={() => setIsModalOpen(false)} className="rounded-lg">Batal</Button>
                        <Button type="primary" htmlType="submit" className="bg-indigo-600 rounded-lg px-8 font-bold">Simpan Akun</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;
