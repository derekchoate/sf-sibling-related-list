import { LightningElement, api, wire, track } from 'lwc';
import { getRelatedListRecords, getRelatedListsInfo, getRelatedListInfo } from 'lightning/uiRelatedListApi';
import { getRecord, getFieldValue, getFieldDisplayValue } from 'lightning/uiRecordApi';
import { NavigationMixin } from "lightning/navigation";
import ERROR_MESSAGE from "@salesforce/label/c.Sibling_Related_List_Error_Message";

export default class SiblingRelatedList extends NavigationMixin(LightningElement) {

    /**
     * Id of the record being viewed
     * @type {string}
     */
    @api
    recordId;

    /**
     * SObject Type of the record being viewed
     * @type {string}
     */
    @api
    sObjectTypeName;

    /**
     * SObject Type of the parent
     * @type {string}
     */
    @api
    parentSObjectTypeName;

    /**
     * API Name of the field that holds the parent id
     * @type {string}
     */
    @api
    parentIdField;

    /**
     * API name of the child relationship on the parent object that relates to the child records to display
     * @type {string} 
     */
    @api
    relationshipName;

    /**
     * Id of the parent record
     * @type {string}
     */
    parentRecordId;

    /**
     * Id of the parent's recordType
     */
    parentRecordTypeId;

    /**
     * Summary info about the related list, includes things like the icon and colour
     * @type {Object<string, *>} Related List Info Summary https://developer.salesforce.com/docs/atlas.en-us.uiapi.meta/uiapi/ui_api_responses_related_list_summary.htm
     */
    relatedListSummary;

    /**
     * Detail information about the related list, included the column definitions
     * @type {Object<string, *>} Related List Info https://developer.salesforce.com/docs/atlas.en-us.uiapi.meta/uiapi/ui_api_responses_related_list_metadata.htm
     */
    relatedListInfo;

    /**
     * Columns to display
     * @type {[Object<string, *>]} Array of columns
     */
    displayColumns;

    /**
     * an array of field names (derived from the displayColumns)
     * @type {[string]} Array of filed names
     */
    @track
    relatedListFieldNames;

    /**
     * The current page of records (from getRelatedRecords)
     * @type {Object<string, *>} Related List Record Collection https://developer.salesforce.com/docs/atlas.en-us.uiapi.meta/uiapi/ui_api_responses_related_list_record_collection.htm
     */
    page;

    /**
     * The array of records to display
     * @type {[Object<string, *>]} Array of Records https://developer.salesforce.com/docs/atlas.en-us.uiapi.meta/uiapi/ui_api_responses_record.htm#ui_api_responses_record
     */
    records;

    /**
     * link to view all related records
     */
    moreLink;

    /**
     * flag to indicate whether an error occurred whilst loading the data
     * @type {boolean} true, if there was an error loading the data, otherwise false
     */
    hasError = false;

    /**
     * Whether the record has been loaded
     * @type {boolean}
     */
    recordLoaded = false;

    /**
     * Whether the parent record has been loaded
     * @type {boolean}
     */
    parentRecordLoaded = false;

    /**
     * Whether the related list summary has loaded
     * @type {boolean}
     */
    relatedListSummaryLoaded = false;

    /**
     * Whether the related list detail has loaded
     * @type {boolean}
     */
    relatedListDetailLoaded = false;

    /**
     * Whether the related list records have been loaded
     * @type {boolean}
     */
    relatedListRecordsLoaded = false;

    /**
     * The relationship label
     * @type {string}
     */
    get relationshipLabel() {
        return this.relatedListSummary?.label;
    }
  
    /**
     * Field definition for the Parent ID Field
     * @type {Object<string, *>} fieldDefintion
     */
    get parentIdFieldDefinition() {
        return {"fieldApiName":this.parentIdField,
                "objectApiName":this.sObjectTypeName};
    }

    /**
     * Field definition for the Record Type ID
     * @type {Object<string, *>} fieldDefintion
     */
    get recordTypeIdFieldDefinition() {
        return {"fieldApiName":"RecordTypeId",
                "objectApiName":this.parentSObjectTypeName};
    }

    /**
     * Parent ID Field in an array
     * @type {[Object<string, *>]} fieldDefintions
     */
    get parentIdFieldArray() {
        return [this.parentIdFieldDefinition];
    }

    /**
     * Field definition for the Record Type ID
     * @type {Object<string, *>} fieldDefintion
     */
    get recordTypeIdFieldArray() {
        return [this.recordTypeIdFieldDefinition];
    }

    /**
     * URL of the related list icon
     * @type {string} url
     */
    get iconUrl() {
        return this.relatedListSummary?.themeInfo?.iconUrl ?? '';
    }

    /**
     * HEX Color code for the icon
     * @type {string}
     */
    get iconColor() {
        if (this.relatedListSummary?.themeInfo?.color) {
            return '#' + this.relatedListSummary.themeInfo.color;
        }
        return '';
    }

    /**
     * Plural label of the related list object
     * @type {string}
     */
    get entityLabelPlural() {
        return this.relatedListSummary?.entityLabelPlural ?? '';
    }

    /**
     * Related list label
     * @type {string}
     */
    get relatedListLabel() {
        return this.relatedListSummary?.label ?? '';
    }

    /**
     * Flag to indicate whether all loading was complete
     */
    get dataLoaded() {
        return (this.recordLoaded &&
                this.parentRecordLoaded &&
                this.relatedListDetailLoaded &&
                this.relatedListRecordsLoaded);
    }

    /**
     * Error message to display to the user
     * @type {string}
     */
    get errorMessage() {
        return ERROR_MESSAGE;
    }

    /**
     * Gets the parentId for this record
     */
    @wire (getRecord, {
        recordId: "$recordId",
        fields: "$parentIdFieldArray"
    })
    handleGetRecord({ error, data }) {
        if (data) {
            this.parentRecordId = getFieldValue(data, this.parentIdFieldDefinition);
            this.generateMoreLink().then(link => {
                this.moreLink = link;
            });
            this.recordLoaded = true;
        }
        else if (error) {
            this.hasError = true;
            console.error('An error occurred whilst retrieving the record');
            console.error(JSON.stringify(error, null, 5));
        }
    }

    /**
     * Gets the parent recordTypeId for the parent record
     */
    @wire (getRecord, {
        recordId: "$parentRecordId",
        fields: "$recordTypeIdFieldArray"})
    handleGetParentRecord({ error, data }) {
        if (data) {
            this.parentRecordTypeId = getFieldValue(data, this.recordTypeIdFieldDefinition);
            this.parentRecordLoaded = true;
        }
        else if (error) {
            this.parentRecordLoaded = true;
        }
    }

    /**
     * Gets the related list summary for the child relationship
     */
    @wire(getRelatedListsInfo, {
        parentObjectApiName: "$parentSObjectTypeName",
        recordTypeId: "$parentRecordTypeId"
    })
    handleGetRelatedListsInfo({ error, data }) {
        if (data && Array.isArray(data.relatedLists)) {
            this.relatedListSummary = data.relatedLists.find(rl => rl.relatedListId?.toLowerCase() === this.relationshipName?.toLowerCase());
            this.setIconColor();
            this.relatedListSummaryLoaded = true;
        }
        else if (error) {
            this.hasError = true;
            console.error('An error occurred whilst retrieving the related list summary');
            console.error(JSON.stringify(error, null, 5));
        }
    }

    /**
     * Gets the related list info for the child relationship
     */
    @wire(getRelatedListInfo, {
        parentObjectApiName: "$parentSObjectTypeName",
        relatedListId: "$relationshipName",
        recordTypeId: "$parentRecordTypeId"
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
            this.relatedListDetailLoaded = true;
        }
        else if (error) {
            this.hasError = true;
            console.error('An error occurred whilst retrieving the related list info');
            console.error(JSON.stringify(error, null, 5));
        }
    }

    /**
     * Gets the related list records for the child relationship
     */
    @wire(getRelatedListRecords, {
        parentRecordId: "$parentRecordId",
        relatedListId: "$relationshipName",
        fields: "$relatedListFieldNames"
    })
    async handleGetRelatedListRecords({ error, data }) {
        if (data) {
            this.page = data;
            this.records = await this.prepareDisplayRecords(data.records);
            this.relatedListRecordsLoaded = true;
        }
        else if (error) {
            this.hasError = true;
            console.error('An error occurred whilst retrieving the related list records');
            console.error(JSON.stringify(error, null, 5));
        }
    }

    /**
     * Sets the icon background colour
     */
    setIconColor() {
        this.template.host.style.setProperty('--iconColor', this.iconColor);
    }

    /**
     * Modifies the records such that the data structure is compatible with the lightning datatable
     */
    async prepareDisplayRecords(relatedListRecords) {
        let records = [];

        //If the related list records isn't an array, then return
        if (!Array.isArray(relatedListRecords) ||
            !Array.isArray(this.displayColumns)) {
            return records;
        }

        //Loop through the records and map each one
        for (const recordData of relatedListRecords) {
            let record = {
                id: recordData.id
            };

            //Loop throug the fields to get the values
            for (const field of this.displayColumns) {

                //If the data type is textArea, then unescape HTML
                if (field.dataType === 'textarea') {
                    record[field.fieldApiName] = getFieldValue(recordData, field.apiPath) || '';
                }

                //If the data type is string, then get the display value
                else if (field.type === 'string') {
                    record[field.fieldApiName] = getFieldDisplayValue(recordData, field.apiPath) || '';
                }

                // otherwise allow the components to format the value correctly
                else {
                    record[field.fieldApiName] = getFieldValue(recordData, field.apiPath) || '';
                }
                
                //If the field is a lookup, set the url
                if (field.lookupId) {
                    record[`${field.fieldApiName}-resourceUrl`] = await this.generateRecordUrl(recordData, field);
                }
            }
            records.push(record);
        }
        
        return records;
    }

    /**
     * Map the columns to the expected input by the lightning datatable
     * @param {Object<string, *>} relatedListInfo 
     * @returns {[Object<string, *>]} list of fields to display in the related list
     */
    prepareColumns(relatedListInfo) {
        let fields = [];

        if (!Array.isArray(relatedListInfo?.displayColumns) || 
            !Array.isArray(relatedListInfo?.objectApiNames)) {
                return fields;
        }

        relatedListInfo.displayColumns.forEach(col => {

            //clone the original column
            let field = structuredClone(col);

            //set the API path which is used later on to get the field value
            field.apiPath = `${relatedListInfo.objectApiNames[0]}.${field.fieldApiName}`;

            //map the fieldApiName to the fieldName
            field.fieldName = field.fieldApiName;

            //map the fieldType
            field.type = this.getColumnType(field);

            //If the field is a lookup field, set additional properties to render the url properly
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

    /**
     * Generate a link to a record (used to create links in lookup fields)
     * @param {Object<string, *>} recordData from the getRelatedRecords api
     * @param {*} field from the display columns
     * @returns {string} url to the record
     */
    async generateRecordUrl(recordData, field) {

        try {

            //if the field isn't a lookup field, return nothing
            if (!field.lookupId) {
                return undefined;
            }

            //get the field that hols the lookup relationship
            let lookupId = field.lookupId;

            let recordId;

            //if the field relates to the related record, then use it's record ID
            if (lookupId === 'Id') {
                recordId = recordData.id;
            }

            //otherwise navigate to the field that contains the related id
            else {

                //remove ".Id" from the end of the field path
                if (lookupId.endsWith('.Id')) {
                    lookupId = lookupId.substring(0, lookupId.length - 3);
                }

                //start with the fields node on the record data
                let currentVal = recordData.fields;

                //loop through each element of the path and get the corresponding value node
                for (const objKey of lookupId.split('\\.')) {
                    currentVal = currentVal[objKey]?.value;
                    if (currentVal === undefined) {
                        console.error(`could not find field value with key ${objKey}`);
                        break;
                    }
                }

                //if a value node wasn't found, return nothing
                if (!currentVal) {
                    return undefined;
                }

                //otherwise set the record id to the id of the current value
                recordId = currentVal.id;
            }
            
            //just in case no record id was found, or it was null, return nothing
            if (!recordId) {
                return undefined;
            }
            
            //generate the url and return it
            return await this[NavigationMixin.GenerateUrl]({
                type: "standard__recordPage",
                attributes: {
                    actionName: "view",
                    recordId: recordId
                }
            });
        }
        catch (ex) {
            console.error('an error occurred whilst generating a record url');
            console.error(JSON.stringify(ex, null, 5));
            return undefined;
        }
    }

    async generateMoreLink() {
        const link = await this[NavigationMixin.GenerateUrl]({
            type: "standard__recordRelationshipPage",
            attributes: {
                actionName : 'view',
                objectApiName: this.parentSObjectTypeName,
                recordId: this.parentRecordId,
                relationshipApiName: this.relationshipName
            }
        });

        return link;
    }

    /**
     * Get the field type for the lightning datatable
     * @param {string} column
     * @returns {string} data type
     */
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