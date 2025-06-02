public with sharing class SiblingRelatedListUtils {

    @AuraEnabled
    public static string getSObjectTypeName(Id recordId){
        try {
            return recordId.getSobjectType().getDescribe(SObjectDescribeOptions.DEFERRED).name;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

}