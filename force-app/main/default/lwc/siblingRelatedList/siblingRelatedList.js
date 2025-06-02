import { LightningElement, api, wire, track } from 'lwc';
import { getRelatedListRecords, getRelatedListsInfo, getRelatedListInfo } from 'lightning/uiRelatedListApi';
import { getRecord, getFieldValue, getFieldDisplayValue } from 'lightning/uiRecordApi';
import { NavigationMixin } from "lightning/navigation";

export default class SiblingRelatedList extends NavigationMixin(LightningElement) {

    @api
    recordId;

    @api
    sObjectTypeName;

    @api
    parentSObjectTypeName;

    @api
    parentRecordId;

    @api
    parentIdField;

    @api
    relationshipName;

    relatedListSummary;

    relatedListInfo;

    displayColumns;

    @track
    relatedListFieldNames;

    page;

    records;

    connected = false;

    get parentIdFieldDefinition() {
        return {"fieldApiName":this.parentIdField,
                "objectApiName":this.sObjectTypeName};
    }

    get parentIdFieldArray() {
        return [this.parentIdFieldDefinition];
    }

    get iconUrl() {
        return this.relatedListSummary?.themeInfo?.iconUrl ?? '';
    }

    get iconColor() {
        if (this.relatedListSummary?.themeInfo?.color) {
            return '#' + this.relatedListSummary.themeInfo.color;
        }
        return '';
    }

    get entityLabelPlural() {
        return this.relatedListSummary?.entityLabelPlural ?? '';
    }

    get relatedListLabel() {
        return this.relatedListSummary?.label ?? '';
    }

    @wire (getRecord, {
        recordId: "$recordId",
        fields: "$parentIdFieldArray"
    })
    handleGetRecord({ error, data }) {
        if (data) {
            this.parentRecordId = getFieldValue(data, this.parentIdFieldDefinition);
        }
        else if (error) {
            console.error('An error occurred whilst retrieving the record');
            console.error(JSON.stringify(error, null, 5));
        }
    }

    @wire(getRelatedListsInfo, {
        parentObjectApiName: "$parentSObjectTypeName"
    })
    handleGetRelatedListsInfo({ error, data }) {
        if (data && Array.isArray(data.relatedLists)) {
            this.relatedListSummary = data.relatedLists.find(rl => rl.relatedListId?.toLowerCase() === this.relationshipName?.toLowerCase());
            this.setIconColor();
        }
        else if (error) {
            console.error('An error occurred whilst retrieving the related list summary');
            console.error(JSON.stringify(error, null, 5));
        }
    }

    @wire(getRelatedListInfo, {
        parentObjectApiName: "$parentSObjectTypeName",
        relatedListId: "$relationshipName"
    })
    handleGetRelatedListInfo({ error, data }) {
        if (data) {
            this.displayColumns = this.prepareColumns(data);
            if (this.displayColumns && Array.isArray(this.displayColumns)) {
                this.relatedListFieldNames = this.displayColumns.map(col => col.apiPath);
            }
            else {
                this.relatedListFieldNames = undefined;
            }
        }
        else if (error) {
            console.error('An error occurred whilst retrieving the related list info');
            console.error(JSON.stringify(error, null, 5));
        }
    }

    @wire(getRelatedListRecords, {
        parentRecordId: "$parentRecordId",
        relatedListId: "$relationshipName",
        fields: "$relatedListFieldNames"
    })
    async handleGetRelatedListRecords({ error, data }) {
        if (data) {
            this.page = data;
            this.records = await this.composeDisplayRecords(data.records);
        }
        else if (error) {
            console.error('An error occurred whilst retrieving the related list records');
            console.error(JSON.stringify(error, null, 5));
        }
    }

    setIconColor() {
        if (this.refs.relatedListIcon) {
            this.refs.relatedListIcon.style.backgroundColor = this.iconColor;
        }
    }

    async composeDisplayRecords(relatedListRecords) {
        let records = [];

        if (!Array.isArray(relatedListRecords) ||
            !Array.isArray(this.displayColumns)) {
            return records;
        }

        for (const recordData of relatedListRecords) {
            let record = {
                id: recordData.id
            };

            
            for (const field of this.displayColumns) {
                if (field.type === 'string') {
                    record[field.fieldApiName] = getFieldDisplayValue(recordData, field.apiPath);
                }
                else {
                    record[field.fieldApiName] = getFieldValue(recordData, field.apiPath);
                }
                
                if (field.lookupId) {
                    record[`${field.fieldApiName}-resourceUrl`] = await this.generateRecordUrl(recordData, field);
                }
            }
            records.push(record);
        }
        
        console.log('records...');
        console.log(JSON.stringify(records, null, 5));
        return records;
    }

    prepareColumns(relatedListInfo) {
        let fields = [];

        if (!Array.isArray(relatedListInfo?.displayColumns) || 
            !Array.isArray(relatedListInfo?.objectApiNames)) {
                return fields;
        }

        relatedListInfo.displayColumns.forEach(col => {
            let field = structuredClone(col);
            field.apiPath = `${relatedListInfo.objectApiNames[0]}.${field.fieldApiName}`;
            field.fieldName = field.fieldApiName;
            field.type = this.getColumnType(field);

            if (field.lookupId) {
                field.fieldName = `${field.fieldName}-resourceUrl`;
                field.typeAttributes = {
                    label : {
                        fieldName: field.fieldApiName
                    },
                    tooltip : {
                        fieldName: field.fieldApiName
                    }
                }
            }

            fields.push(field);
        });

        return fields;
    }

    async generateRecordUrl(recordData, field) {

        try {
            if (!field.lookupId) {
                return undefined;
            }

            let lookupId = field.lookupId;

            let recordId;

            if (lookupId === 'Id') {
                recordId = recordData.id;
            }

            else {
                if (lookupId.endsWith('.Id')) {
                    lookupId = lookupId.substring(0, lookupId.length - 3);
                }

                let currentVal = recordData.fields;

                for (const objKey of lookupId.split('\\.')) {
                    currentVal = currentVal[objKey]?.value;
                    if (!currentVal) {
                        console.error(`could not find object with key ${objKey}`);
                        break;
                    }
                }

                if (!currentVal) {
                    return undefined;
                }

                recordId = currentVal?.id;
            }
            
            if (!recordId) {
                console.error(`could not find record id`);
                return undefined;
            }
            
            return await this[NavigationMixin.GenerateUrl]({
                type: "standard__recordPage",
                attributes: {
                    actionName: "view",
                    recordId: recordId
                }
            });
        }
        catch (ex) {
            console.log('an error occurred whilst generating a record url');
            console.log(JSON.stringify(ex, null, 5));
            return undefined;
        }
    }

    getColumnType(column) {

        if (column.lookupId) {
            return 'url';
        }

        if (column.dataType === 'datetime') {
            return 'date-local';
        }

        if (column.dataType === 'picklist') {
            return 'string';
        }

        return column.dataType;
    }

}