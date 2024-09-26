import { LightningElement, wire, track,api } from 'lwc';
import getexpense from '@salesforce/apex/InLineEditExpenseRec.getexpense';
import saveExpense from '@salesforce/apex/InLineEditExpenseRec.saveExpense';
//import Approval_Field from '@salesforce/schema/Expense_Item__c.Approval_Status__c';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import {CurrentPageReference} from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';


const columns = [
{
    label: 'Name',
    fieldName: 'Name',
    type: 'text',
}, {
    label: 'Tour Type',
    fieldName: 'Tour_Type__c',
    type: 'Picklist',
    //editable: true,
}, {
    label: 'Expense Type',
    fieldName: 'Expense_Item__c',
    type: 'Picklist',
    
}, {
    label: 'Amount',
    fieldName: 'Amount__c',
    type: 'Currency'
    
}, {
    label: 'Approval Status',
    fieldName: 'Approval_Status__c',
    type: 'Picklist',
    editable: true,
}, {
    label: 'Expense Date',
    fieldName: 'Date__c',
    type: 'Date',
    
}
];

export default class InLineEditingExpenseData extends LightningElement {
columns = columns;
saveDraftValues = [];
@track newExpList = [];
@api recordId;
isLoading = false;
showSaveButton = false;

@wire(CurrentPageReference)
getStateParameters(currentPageReference) {
    if (currentPageReference && (this.recordId == null || this.recordId == undefined)) {
        this.recordId = currentPageReference.state.recordId;
        console.log(this.recordId);
    }
}

connectedCallback() {
    saveExpense({jsExpList : JSON.stringify(this.newExpList)})
        .then(data => {
            this.isLoading = false;
            console.log('result----- '+data);
        }).catch(error => {
            this.handleError(error);
        });
}


    connectedCallback(){
        this.init();
    }

    init(){
        this.isLoading = true;
        getexpense({ToorId : this.recordId })
        .then(response => {
            this.isLoading = false;
            console.log('Result----'+response);
            if(response){
                this.newExpList = JSON.parse(response);
                if(this.newExpList){
                    let sfdcBaseURL = window.location.origin;
                    for (let i = 0; i < this.newExpList.length; i++) {
                        this.newExpList[i].hrefLink = sfdcBaseURL+'/lightning/r/Expense_Item__c/'+ this.newExpList[i].Id + '/view';
                        this.newExpList[i].sNo = i+1;
                        if(this.newExpList[i].Approval_Status__c == 'Approved' || this.newExpList[i].Approval_Status__c == 'Rejected'){
                            this.newExpList[i].isDisabled = true;
                        }else{
                            this.newExpList[i].isDisabled = false;
                        }
                    }
                }
            }
            
        })
        .catch(error =>{
            console.log(error);
        })
    }

approvalStatusOptions = [
    {label : 'Pending', value : 'Pending'},
    {label : 'Approved', value : 'Approved'},
    {label : 'Rejected', value : 'Rejected'}
];

handleApprovalStatusChange(event) {
        // Handle the approval status change here
        this.showSaveButton = true;
        let index = event.target.dataset.index;
        console.log(index);
        const selectedValue = event.detail.value;
        console.log(selectedValue);
        this.newExpList[index].Approval_Status__c = selectedValue;
        console.log(JSON.stringify(this.newExpList[index]));
    }

// @wire(getexpense,{ToorId :'$recordId' })
// contactData({ error, data }) {
//     if (data) {
//         this.data = data;
//         this.newExpList = JSON.stringify(JSON.parse(this.data));
        
//         for (let i = 0; i < this.newExpList.length; i++) {
//             if(this.newExpList[i].hasOwnProperty('Approval_Status__c') && this.newExpList[i].Approval_Status__c){

//             }else{
//                 this.newExpList[i].Approval_Status__c = '';
//             }
                
//         }
//         this.error = undefined;
//         } 
//     else if (error) {
//         this.error = error;
//         this.data = undefined;
//         }
// };

handleSave() {
    this.isLoading = true;
    saveExpense({jsExpList : JSON.stringify(this.newExpList)})
        .then(data => {
            this.isLoading = false;
            if(data){
                this.showSaveButton = false;
                console.log('data-- '+data);
                this.ShowToast( 'Success!', 'Expense records has been saved successfully!', 'success', 'dismissable');
                this.newExpList = JSON.parse(data);
                if(this.newExpList != null && this.newExpList != undefined && this.newExpList.length >0){
                    for (let i = 0; i < this.newExpList.length; i++) {
                        if(this.newExpList[i].Approval_Status__c == 'Approved' || this.newExpList[i].Approval_Status__c == 'Rejected'){
                            this.newExpList[i].isDisabled = true;
                        }else{
                            this.newExpList[i].isDisabled = false;
                        }
                        if(this.newExpList[i].Approval_Status__c == null || this.newExpList[i].Approval_Status__c == undefined || this.newExpList[i].Approval_Status__c == ''){
                            this.newExpList[i].Approval_Status__c = 'Pending';
                        }
                    }
                }
            }
        }).catch(error => {
            this.handleError(error);
        });
}

handleError(error) {
    if (error) {
        let errorMg = 'Unknown error';
        if (Array.isArray(error.body)) {
            errorMg = error.body.map(e => e.message);
        }
        // UI API DML, Apex and network errors
        else if (error.body && typeof error.body.message === 'string') {
            errorMg = error.body.message;
        }
        // JS errors
        else if (typeof error.message === 'string') {
            errorMg = error.message;
        }
        this.ShowToast( 'Error!', errorMg, 'error', 'dismissable');
    }
    this.isLoading = false;
    }

ShowToast(title, message, variant, mode){
    const evt = new ShowToastEvent({
            title: title,
            message:message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(evt);
}

// This function is used to refresh the table once data updated
async refresh() {
    await refreshApex(this.newExpList);
}
}