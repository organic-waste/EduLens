/* 实时协作的云同步功能 */
class CloudSync{
    constructor(){
        this.baseURL = 'http://localhost:3000/api';
        this.isOnline = false;
    }

    async testConnection(){
        try {
            const response = await fetch(`${this.baseURL}/test`);
            if(response.ok){
                const data = await response.json();
                console.log('连接后端成功',data);
                this.isOnline = true;
                return true;
            }
        }catch (error){
            console.warn('连接后端失败', error);
            this.isOnline = true;
        }
        return false;
    }

    async healthCheck(){
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return response.ok;
        }catch(error){
            return false;
        }
    }
}


export default new CloudSync();