//管理事件监听器

class EventManager{
    constructor(){
        //用 Map 而不用对象 {}，是因为 Map 的 key 可以是任意类型，并且自带迭代器，删除性能更好
        this.listeners = new Map();
    }
    //添加监听器
    on(element,event,handler,options = {}){
        const key = `${element},${event}`;
        if(!this.listeners.has(key)){
            this.listeners.set(key,new Set());
        }
        this.listeners.get(key).add(handler);
        element.addEventListener(event,handler,options);
    }
    //删除特定事件中的特定回调
    off(element,event,handler){
        const key = `${element},${event}`;
        const handlers = this.listeners.get(key);
        if(handlers && handlers.has(handler)){
            element.removeEventListener(event,handler);
            handlers.delete(handler);  //确保在Set结构中也删除
        }
    }
    //删除特定事件中的全部回调
    offEvent(element,event){
        const key = `${element},${event}`;
        const handlers = this.listeners.get(key);
        if(handlers){
            handlers.forEach(h =>{
                element.removeEventListener(event,h);
            })
            handlers.clear();
        }
    }
    //删除特定对象的全部事件
    offElement(element){
        const listeners = Array.from(this.listeners.keys());
        listeners.forEach((key)=>{
            const Info = key.split(',');
            console.log("offElement",Info);
            if(element === Info[0]){
                console.log("success");
                element.removeEventListener(Info[1]);
                this.listeners.key.clear();
            }
        })
    }

    //清空全部事件监听器
    clear(){
        const listeners = Array.from(this.listeners.keys());        
        listeners.forEach((key) =>{
            const Info = key.split(',');
            Info[0].removeEventListener(Info[1],h);
        })
        this.listeners.clear();
    }


}

export default new EventManager();

