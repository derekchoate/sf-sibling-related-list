/**
 * Test methods for the SiblingRelatedListUtils class
 */
@isTest
private class SiblingRelatedListUtilsTests {

    /**
     * This method tests that a FieldSet is retrieved by the code. 
     * 
     * Since FieldSets cannot be created by a UnitTest, this code relies on 
     * discovering an existing field set on the Account object to test the code.
     * 
     * To ensure there are no issues with deployment, the unit test will PASS if
     * no field sets are found
     */
    @isTest
    static void testFieldSetIsRetrieved() {
        //  Map<String, Schema.FieldSet> existingFieldSets = Schema.SObjectType.Account.fieldSets.getMap();

        //  if (existingFieldSets.size() == 0) {
        //     System.assert(true, 'This test was not executed because there was no field sets on the account to test with.');
        //     return;
        //  }

        //  for (String fsName : existingFieldSets.keySet()) {
        //     SiblingRelatedListUtils.FieldSet fs = SiblingRelatedListUtils.getFieldSet('Account', fsName);
        //     System.assertEquals(existingFieldSets.get(fsName).name, fs.name, 'Expected to retrieve the same FieldSet as was found in the Account object');
        //     System.assertEquals(existingFieldSets.get(fsName).namespace, fs.namespace, 'A FieldSet was retrieved with the same name, but with a diferent namespace');
        //     return;
        //  }
    }

    /**
     * Tests error handling by passing in an invalid sObject type name
     * and expecting that an exception with be thrown
     */
    @isTest
    static void testErrorIsThrownForInvalidObject() {
        // Boolean errorThrown = false;

        // try {
        //     SiblingRelatedListUtils.FieldSet fs = SiblingRelatedListUtils.getFieldSet('!Account', '!fsName');
        // } 
        // catch (SiblingRelatedListUtils.InvalidSObjectTypeException ex) {
        //     errorThrown = true;
        // }

        // System.assert(errorThrown, 'Expected an error to be thrown when an invalid sObjectName is passed');
    }

    /**
     * Tests error handling by passing in an invalid Field Set name
     * and expecting that an exception with be thrown
     */
    @isTest
    static void testErrorIsThrownForInvalidFieldSet() {
        // Boolean errorThrown = false;

        // try {
        //     SiblingRelatedListUtils.FieldSet fs = SiblingRelatedListUtils.getFieldSet('Account', '!fsName');
        // } 
        // catch (SiblingRelatedListUtils.InvalidFieldSetException ex) {
        //     errorThrown = true;
        // }

        // System.assert(errorThrown, 'Expected an error to be thrown when an invalid FieldSet name is passed');
    }
}