class UserController{

    constructor(formIdCreate, formIdUpdate, tableId){

        this.formEl = document.getElementById(formIdCreate);
        this.formUpdateEl = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);

        this.onSubmit();
        this.onEdit();
        this.selectAll();

    }

    onEdit(){   //this method is responsible for editing the informations of an user

        document.querySelector("#box-user-update .btn-cancel").addEventListener("click", e=>{
            // client click on cancel
            this.showPanelCreate();
            // shows the new user panel
        });

        this.formUpdateEl.addEventListener("submit", event =>{
            //client submit changes
            event.preventDefault();

            let btn = this.formUpdateEl.querySelector("[type=submit]");

            btn.disabled = true; //disabled the button "submit" until all the changes have been processed

            let values = this.getValues(this.formUpdateEl); // get the new infos

            let index = this.formUpdateEl.dataset.trIndex

            let tr = this.tableEl.rows[index];


            let userOld = JSON.parse(tr.dataset.user); // get old user infos in case some stay the same

            let result = Object.assign({}, userOld, values); // mix the old and new infos

            this.getPhoto(this.formUpdateEl).then(
                (content)=>{
                    
                    
                    if(!values.photo) result._photo = userOld._photo;
                    else result._photo = content;

                    let user = new User();

                    user.loadFromJSON(result);

                    user.save();

                    this.getTr(user, tr);

                    this.updateCount();
                    
                    this.formUpdateEl.reset(); // reset the form
                    
                    btn.disabled = false;

                    this.showPanelCreate();

                },
                (e)=>{
                    console.error(e);
                }
            );

        });

    }

    onSubmit(){ //submit a new user
        this.formEl.addEventListener("submit", event =>{

            event.preventDefault();

            let btn = this.formEl.querySelector("[type=submit]");

            btn.disabled = true

            let values = this.getValues(this.formEl);

            if(!values) return false;

            this.getPhoto(this.formEl).then(
                (content)=>{
                    
                    values.photo = content;
                                    
                    values.save();

                    this.addLine(values);

                    this.formEl.reset();

                    btn.disabled = false;
                },
                (e)=>{
                    console.error(e);
                }
            );

        });
    }

    getPhoto(formEl){ //get the user profile picture as a file

        return new Promise((resolve, reject)=>{
            let fileReader = new FileReader();

            let elements = [...formEl.elements].filter(item=>{

                if(item.name === 'photo'){

                    return item;

                }

            });

            let file = elements[0].files[0];

            fileReader.onload = ()=>{

                resolve(fileReader.result);

            };

            fileReader.onerror = (e)=>{

                reject(e);

            };

            if(file){
            
                fileReader.readAsDataURL(file);
            
            }
            else{

                resolve('dist/img/boxed-bg.jpg');
            
            }
        });

        

    }

    getValues(formEl){ // get the infos of the user
        let user = {};
        let isValid = true;

        [...formEl.elements].forEach(function(field, index){

            if(['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value){

                field.parentElement.classList.add('has-error');
                isValid = false;

            }

            if(field.name == "gender"){

                if (field.checked){

                    user[field.name] = field.value;
                
                }
            }
            else if(field.name == "admin"){

                user[field.name] = field.checked;

            }
            else{

                user[field.name] = field.value;

            }
            
        });

        if(!isValid){
            return false;
        }

        return new User(
            user.name,
            user.gender,
            user.birth,
            user.country,
            user.email,
            user.password,
            user.photo,
            user.admin
        );
    }

    selectAll(){ // gets all users in the storage and show them when the page refreshes
        
        let users = User.getUsersStorage();

        users.forEach(dataUser=>{

            let user = new User();

            user.loadFromJSON(dataUser);

            this.addLine(user);

        });

    }

    addLine(dataUser){ // add another tr, a new user

        let tr = this.getTr(dataUser);

        this.tableEl.appendChild(tr);

        this.updateCount();

    }

    getTr(dataUser, tr = null){

        if(tr === null)tr = document.createElement('tr');

        tr.dataset.user = JSON.stringify(dataUser);

        tr.innerHTML = `
            <td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
            <td>${dataUser.name}</td>
            <td>${dataUser.email}</td>
            <td>${(dataUser.admin) ? 'Yes' : 'No'}</td>
            <td>${Utils.dateFormat(dataUser.register)}</td>
            <td>
                <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Edit</button>
                <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Delete</button>
            </td>
        `;
        
        this.addEventsTr(tr);

        return tr;
    }

    addEventsTr(tr){ // this will do the events on tr, delete or edit

        tr.querySelector(".btn-delete").addEventListener("click", e=>{
        //in case click on delete
        if(confirm("Do you really want to delete?")){

            let user = new User();

            user.loadFromJSON(JSON.parse(tr.dataset.user));

            user.remove();

            tr.remove();

            this.updateCount();

        }
        
        });

        tr.querySelector(".btn-edit").addEventListener("click", e=>{
        // in case click on edit
            let json = JSON.parse(tr.dataset.user);

            this.formUpdateEl.dataset.trIndex = tr.sectionRowIndex;

            for(let name in json){

                let field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "]");

                if(field){
                    
                    switch (field.type){
                        case 'file':
                        continue;
                        break;

                        case 'radio':
                            field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "][value=" + json[name] + "]");
                            field.checked = true;
                        break;
                        
                        case 'checkbox':
                            field.checked = json[name];
                        break;

                        default:
                            field.value = json[name];

                    }

                    field.value = json[name];
                    
                }
                

            }

            this.formUpdateEl.querySelector(".photo").src = json._photo;

            this.showPanelUpdate(); // shows the edit panel
            
        });

    }

    showPanelCreate(){

        document.querySelector("#box-user-create").style.display = "block";
        document.querySelector("#box-user-update").style.display = "none";


    }

    showPanelUpdate(){

        document.querySelector("#box-user-create").style.display = "none";
        document.querySelector("#box-user-update").style.display = "block";
        
    }

    updateCount(){ //this update te counters of users and admins

        let numberUsers = 0;
        let numberAdmin = 0;

        [...this.tableEl.children].forEach(tr=>{

            let user = JSON.parse(tr.dataset.user);
            
            if(user._admin)numberAdmin++;
            else numberUsers++;
            
        });

        document.querySelector("#number-users").innerHTML = numberUsers;
        document.querySelector("#number-users-admin").innerHTML = numberAdmin;


    }


}