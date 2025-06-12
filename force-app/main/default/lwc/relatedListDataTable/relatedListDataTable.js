import LightningDatatable from "lightning/datatable";
import richTextTemplate from "./richText.html";

export default class RelatedListDataTable extends LightningDatatable {

    static customTypes = {
        textarea: {
            template: richTextTemplate,
            standardCellLayout: true,
        }
    }


}