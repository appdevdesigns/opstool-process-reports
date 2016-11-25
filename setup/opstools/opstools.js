/**
 * This file specifies any default Ops Portal Tool Definitions 
 * provided by this modlue.
 *  
 */
module.exports = [

    { 
        key:'process.reports.create', 
        permissions:'reports.tool.view', 
        icon:'fa-print', 
        controller:'ProcessReports',
        label:'Create Reports',
        // context:'opsportal',
        isController:true, 
        options:{}, 
        version:'0' 
    },
    { 
        key:'process.reports.view', 
        permissions:'reports.runner.view', 
        icon:'fa-print', 
        controller:'RunReports',
        label:'Run Reports',
        // context:'opsportal',
        isController:true, 
        options:{}, 
        version:'0' 
    }

];
