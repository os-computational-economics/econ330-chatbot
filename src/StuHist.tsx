import type {
    ProColumns,
} from '@ant-design/pro-components';
import {
    ProCard,
    ProTable,
} from '@ant-design/pro-components';
import {message, ConfigProvider, Button, Modal, Tooltip} from 'antd';
import request from 'umi-request';
import enUSIntl from 'antd/lib/locale/en_US';
import Cookies from 'js-cookie';
import Markdown from "react-markdown";

type StuChatHistItem = {
    idx: number;
    timestamp: string;
    user_id: string;
    user_message: string;
    response: string;
    name: string;
};

const columns: ProColumns<StuChatHistItem>[] = [
    {
        title: 'Index',
        dataIndex: 'idx',
        valueType: 'text',
        width: 55,
    },
    {
        title: 'Timestamp',
        dataIndex: 'timestamp',
        valueType: 'dateTime',
        width: 150,
    },
    {
        title: 'Name',
        dataIndex: 'name',
        valueType: 'text',
        width: 150,
    },
    {
        title: 'User Message',
        dataIndex: 'user_message',
        valueType: 'text',
        copyable: true,
        ellipsis: true,
    },
    {
        title: 'Response',
        dataIndex: 'response',
        valueType: 'text',
        render: (_text, row) => (
            <Tooltip title="Click Detail button to see more">
                {JSON.parse(row.response).join('\n')}
            </Tooltip>
        ),
        copyable: true,
        ellipsis: true,
    },
    {
        title: 'option',
        valueType: 'option',
        dataIndex: 'idx',
        render: (_text, row) => [
            <Button key="detail" onClick={() => {
                Modal.info({
                    title: 'Detail',
                    content: (
                        <div>
                            <p>Name: {row.name}</p>
                            <p>User ID: {row.user_id}</p>
                            <p>User Message: {row.user_message}</p>
                            <p>Response:</p>
                            <Markdown>{JSON.parse(row.response).join('\n')}</Markdown>
                        </div>
                    ),
                    onOk() {},
                    width: '70%',
                });
            }
            }>Detail</Button>,
        ],
        width: 100,
    },
];

const StuHist = () => {
    const promptLogin = () => {
        message.error('Please login first.')
            .then(() => {
                window.location.href = '/econ330-chatbot';
            });
    }

    return (
        <ConfigProvider locale={enUSIntl}>
        <ProCard>
                <ProTable<StuChatHistItem>
                    search={false}
                    columns={columns}
                    type={'table'}
                    request={async (params) => {
                        // add login_token to params
                        const login_token = Cookies.get('cy_login_token');
                        if (login_token === undefined) {
                            return request<{
                                data: StuChatHistItem[];
                            }>('https://example.com', {
                                params,
                                errorHandler: promptLogin,
                            });
                        }else{
                            params.login_token = login_token;
                            params.course_id = 'cyc100004';
                            return request<{
                                data: StuChatHistItem[];
                            }>('https://api-v1.courseyai.com/teacher/getStudentChatHistory', {
                                params,
                                errorHandler: (error) => {
                                    console.log(error.response.status);
                                    if (error.response.status === 401) {
                                        window.location.href = 'https://google.com';
                                    }else{
                                        promptLogin();
                                    }
                                }
                            });
                        }
                    }}
                    pagination={{
                        pageSize: 10,
                    }}
                    rowKey="id"
                    dateFormatter="string"
                    headerTitle="Student-AI Interaction History"
                />
        </ProCard>
        </ConfigProvider>
    );
};

export default StuHist;
