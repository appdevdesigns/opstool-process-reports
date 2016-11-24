/**
 * This file specifies any default Ops Portal Tool Definitions 
 * provided by this modlue.
 *  
 */
module.exports = [

    { 
        key:'process.reports', 
        permissions:'reports.tool.view', 
        icon:'fa-print', 
        controller:'ProcessReports',
        label:'Process Reports',
        // context:'opsportal',
        isController:true, 
        options:{}, 
        version:'0' 
    }

];
