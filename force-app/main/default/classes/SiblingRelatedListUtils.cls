public with sharing class SiblingRelatedListUtils {
    
    @AuraEnabled(Cacheable=true)
    public static SiblingRelatedListUtils.FieldSet getFieldSet(String sObjectTypeName, String fieldSetApiName) {
        DescribeSObjectResult sObjDesc = getSObjectTypeDescription(sObjectTypeName);

        return getFieldSet(sObjDesc, fieldSetApiName);
    }

    public static SiblingRelatedListUtils.FieldSet getFieldSet(DescribeSObjectResult sObjectTypeDescription, String fieldSetApiName) {
        Map<String, Schema.FieldSet> fieldSetByApiName = sObjectTypeDescription.fieldSets.getMap();

        if (!fieldSetByApiName.containsKey(fieldSetApiName)) {
            throw new InvalidFieldSetException();
        }

        return new SiblingRelatedListUtils.FieldSet(fieldSetByApiName.get(fieldSetApiName));
    }

    private static Schema.DescribeSObjectResult getSObjectTypeDescription(String sObjectTypeName) {
        try {
            Type sObjType = Type.forName(sObjectTypeName);
            SObject sObj = (SObject)sObjType.newInstance();
            return sObj.getSObjectType().getDescribe(SObjectDescribeOptions.DEFERRED);
        }
        catch (Exception ex) {
            throw new InvalidSObjectTypeException();
        }
    }

    public class FieldSet {

        @AuraEnabled
        public String description;

        @AuraEnabled
        public List<SiblingRelatedListUtils.FieldSetMember> fields;

        @AuraEnabled
        public String label;

        @AuraEnabled
        public String name;

        @AuraEnabled
        public String namespace;

        public FieldSet(Schema.FieldSet fs) {
            this.description = fs.description;
            this.label = fs.label;
            this.name = fs.name;
            this.namespace = fs.namespace;
            this.populateFields(fs.fields);
        }

        private void populateFields(List<Schema.FieldSetMember> fields) {
            this.fields = new List<FieldSetMember>();
            for (Schema.FieldSetMember field : fields) {
                this.fields.add(new FieldSetMember(field));
            }
        }
    }

    public class FieldSetMember {

        @AuraEnabled
        public Boolean dbRequired;

        @AuraEnabled
        public String fieldPath;

        @AuraEnabled
        public String label;

        @AuraEnabled
        public Boolean required;

        @AuraEnabled
        public Schema.DisplayType type;

        public FieldSetMember(Schema.FieldSetMember fsm) {
            this.dbRequired = fsm.dbrequired;
            this.fieldPath = fsm.fieldpath;
            this.label = fsm.label;
            this.required = fsm.required;
            this.type = fsm.type;
        }
    }

    
    public class InvalidSObjectTypeException extends Exception {}
    public class InvalidFieldSetException extends Exception {}

}