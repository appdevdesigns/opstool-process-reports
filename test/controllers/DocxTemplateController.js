var sinon = require('sinon');
var fs = require('fs');
var proxyquire = require('proxyquire').noCallThru();


// Mock data
var mockRenderReportController = {

    staffs: function (req, callback) {

        callback(JSON.stringify({
            status: 'success',
            data: [
                {
                    "person_id": 1,
                    "person_name": "นายยอดเยี่ยม ไปเลย",
                    "person_name_en": "Mr. Aaron Jordan",
                    "person_age": 32,
                    "person_passport_number": "111111111",
                    "person_work_number": "ลภ.ชม.1111/2555",
                    "person_work_address": "N/A (Work address)",
                    "person_visa_start_date": "N/A (Visa date issue)",
                    "person_visa_expire_date": "2017-03-29T16:00:00.000Z",
                    "person_job_title": "อาสาสมัคร",
                    "person_job_description": "เป็นหัวหน้าโครงการฟื้นฟู ประสานงานเกี่ยวกับการสอนชาวบ้านเกี่ยวกับการปลูกพืชแบบเศรษฐกิจพอเพียงและการปลูกกาแฟ ช่วยในการฟื้นฟูสภาพจิตใจและร่างกายของผู้ติดยาเสพติด รับอาสาสมัครเข้าร่วมในโครงการของตัวเอง",
                    "person_work_permit_expire_date": "2017-04-24T16:00:00.000Z",
                    "project_title": "โครงการพลิกฟื้น",
                    "organization_name": "N/A (Organization name)",
                    "organization_chief_name": "N/A (Chief name)",
                    "organization_chief_position": "N/A (Chief position)",
                    "workplace_name": "N/A (Workplace name)",
                    "person_nationality": "อเมริกัน",
                    "number_of_approved_images": 0,
                    "number_of_approved_activities": 0,
                    "person_home_address": "11/1 หมู่ 1 บ้านจันทร์ อ.เมืองเชียงใหม่ จ.เชียงใหม่ "
                },
                {
                    "person_id": 4,
                    "person_name": "นางสาวสมหญิง ยิงเรือ",
                    "person_name_en": "Miss Diana Backham",
                    "person_age": "N/A (Age)",
                    "person_passport_number": "222222222",
                    "person_work_number": "ลภ.ชม. 2222/2556",
                    "person_work_address": "N/A (Work address)",
                    "person_visa_start_date": "N/A (Visa date issue)",
                    "person_visa_expire_date": "2014-01-20T16:00:00.000Z",
                    "person_job_title": "N/A (Job title)",
                    "person_job_description": "N/A (Job description)",
                    "person_work_permit_expire_date": "2014-12-08T16:00:00.000Z",
                    "project_title": "โครงการบ้านสานรัก4",
                    "organization_name": "N/A (Organization name)",
                    "organization_chief_name": "N/A (Chief name)",
                    "organization_chief_position": "N/A (Chief position)",
                    "workplace_name": "N/A (Workplace name)",
                    "person_nationality": "N/A (Nationality)",
                    "number_of_approved_images": 0,
                    "number_of_approved_activities": 0,
                    "person_home_address": ""
                }
            ]
        }));

    },

    activity_images: function (req, callback) {

        callback(JSON.stringify({
            status: 'success',
            data: [
                {
                    "image_id": 5433,
                    "image_file_name": "721_5433_cc08b6f9-481d-4268-9bb0-38a3c91e4b2e_print.jpg",
                    "image_date": "2018-04-18T16:00:00.000Z",
                    "person_id": 1,
                    "activity_id": 721,
                    "image_caption": "ให้การสนับสนุนและดูแลเด็กและเยาวชนที่เข้าร่วมโครงการ",
                    "image_caption_govt": "",
                    "activity_name": "[th]Celebrating a birthday of a young person in our programme, assisting to build value and self worth. ",
                    "activity_name_govt": "[th]Celebrating a birthday of a young person in our programme, assisting to build value and self worth ",
                    "activity_description": "[th]Providing counselling and support to at risk young person.",
                    "activity_description_govt": "[th]Providing counselling and support to vulnerable and at risk young person",
                    "activity_start_date": "2018-01-23T16:00:00.000Z",
                    "activity_end_date": "2018-01-23T16:00:00.000Z",
                    "project_id": "HUG",
                    "project_name": "HUG Project (Trafficking Prevention)"
                },
                {
                    "image_id": 6081,
                    "image_file_name": "578_6081_75bd9ffe-67d4-46d1-b1fe-904aa8fe6da3_print.jpeg",
                    "image_date": "2018-06-24T16:00:00.000Z",
                    "person_id": 1,
                    "activity_id": 578,
                    "image_caption": "เข้าร่วมประชุมเพื่อหาแนวทางในการให้ความรู้และอบรมแก่พ่อแม่บุญธรรมที่จะดูแลเด็กๆได้อย่างดี โดยมีผู้เข้าร่วมจากฝ่ายรับบุตรบุญธรรมจากบ้านเด็กชาย บ้านเวียงพิงค์และมูลนิธิ Care for Children\n",
                    "image_caption_govt": "สำนักงานมูลนิธิ Care for Children ต.ช้างเผือก\n",
                    "activity_name": "[th]Meeting with Government officials",
                    "activity_name_govt": "[th]Meeting with Government officials to develop foster care best practices and trainings",
                    "activity_description": "[th]Attending meetings with government officials from the Chiang Mai foster care department at Home for Boys to discuss how to provide essential training to current and potential foster families",
                    "activity_description_govt": "[th]Attending meetings with government officials from the Chiang Mai foster care department at Home for Boys to discuss how to provide essential training to current and potential foster families",
                    "activity_start_date": "2017-04-29T16:00:00.000Z",
                    "activity_end_date": "2017-12-29T16:00:00.000Z",
                    "project_id": "JoJo",
                    "project_name": "Jojos Sanctuary"
                },
                {
                    "image_id": 6082,
                    "image_file_name": "738_6082_c4998d0a-5937-4bcb-a28e-460d60045017_print.JPG",
                    "image_date": "2018-06-22T16:00:00.000Z",
                    "person_id": 1,
                    "activity_id": 738,
                    "image_caption": "จัดกิจกรรมให้เด็กๆ ได้เรียนรู้ประเทศข้อมูลของประเทศญี่ปุ่น เพื่อเปิดโลกให้กับเด็กๆมากขึ้น ",
                    "image_caption_govt": "โครงการฮัก ต.สุเทพ",
                    "activity_name": "[th]Molding Stars After School Program",
                    "activity_name_govt": "[th]Molding Stars After School Program",
                    "activity_description": "[th]Providing support and education for students and their families in the 12 Punna area.",
                    "activity_description_govt": "[th]Providing support and education for students and their families in the 12 Punna area.",
                    "activity_start_date": "2017-12-31T16:00:00.000Z",
                    "activity_end_date": "2018-12-30T16:00:00.000Z",
                    "project_id": "HUG",
                    "project_name": "HUG Project (Trafficking Prevention)"
                },
                {
                    "image_id": 6083,
                    "image_file_name": "699_6083_816b3656-e058-4edf-8c13-0de1267dd5f4_print.JPG",
                    "image_date": "2018-06-28T16:00:00.000Z",
                    "person_id": 1,
                    "activity_id": 699,
                    "image_caption": "ไปเยี่ยมครอบครัวของเด็กเพื่อสร้างความสัมพันธ์ที่ดีและช่วยส่งเสริมให้ครอบครัวได้อยู่ร่วมกันและทำบทบาทหน้าที่พ่อแม่ได้อย่างดี\n",
                    "image_caption_govt": "อ.แม่ริม",
                    "activity_name": "[th]Building Family Dreams",
                    "activity_name_govt": "[th]Family Strengthening Programs",
                    "activity_description": "[th]Run a family strengthening program entitled Building Family Dreams with families currently or at risk of separation due to poverty",
                    "activity_description_govt": "[th]Run a family strengthening program entitled Building Family Dreams with families currently or at risk of separation due to poverty",
                    "activity_start_date": "2018-01-30T16:00:00.000Z",
                    "activity_end_date": "2019-08-29T16:00:00.000Z",
                    "project_id": "JoJo",
                    "project_name": "Jojos Sanctuary"
                },
                {
                    "image_id": 6084,
                    "image_file_name": "445_6084_27bce7a3-cff7-4092-b9e6-c101ea154e79_print.JPG",
                    "image_date": "2018-05-13T16:00:00.000Z",
                    "person_id": 1,
                    "activity_id": 445,
                    "image_caption": "ทานข้าวกับผู้สนับสนุนที่อเมริกาและได้รายงานสิ่งที่เกิดขึ้นในโครงการเมื่อปีที่แล้วให้กับผู้สนับสนุนทราบ\n",
                    "image_caption_govt": "ลอสแองเจลลิส แคริฟอร์เนีย อเมริกา\n",
                    "activity_name": "หาทุนสนับสนุนสำหรับโครงการ",
                    "activity_name_govt": "หาทุนสนับสนุนสำหรับโครงการ",
                    "activity_description": "พบเจอกับผู้สนับสนุนเพื่อหาทุนสนับสนุนสำหรับโครงการและการเปิดศูนย์พักพิงของโครงการในปี 2562",
                    "activity_description_govt": "พบเจอกับผู้สนับสนุนเพื่อหาทุนสนับสนุนสำหรับโครงการและการเปิดศูนย์พักพิงของโครงการในปี 2562",
                    "activity_start_date": "2017-03-08T16:00:00.000Z",
                    "activity_end_date": "2017-06-08T16:00:00.000Z",
                    "project_id": "JoJo",
                    "project_name": "Jojos Sanctuary"
                },
                {
                    "image_id": 6132,
                    "image_file_name": "699_6132_6bffc223-ea55-4681-b952-5f640e070641_print.jpg",
                    "image_date": "2018-07-11T16:00:00.000Z",
                    "person_id": 1,
                    "activity_id": 699,
                    "image_caption": "ส่งเสริมเรื่องการออกทรัยพ์ให้กับเด็กๆ ด้วยการสอนให้พวกเขาทำออมสินด้วยตัวเอง",
                    "image_caption_govt": "โครงการ Jojo's Sanctuary",
                    "activity_name": "[th]Building Family Dreams",
                    "activity_name_govt": "[th]Family Strengthening Programs",
                    "activity_description": "[th]Run a family strengthening program entitled Building Family Dreams with families currently or at risk of separation due to poverty",
                    "activity_description_govt": "[th]Run a family strengthening program entitled Building Family Dreams with families currently or at risk of separation due to poverty",
                    "activity_start_date": "2018-01-30T16:00:00.000Z",
                    "activity_end_date": "2019-08-29T16:00:00.000Z",
                    "project_id": "JoJo",
                    "project_name": "Jojos Sanctuary"
                },
                {
                    "image_id": 6133,
                    "image_file_name": "699_6133_b734da54-79d2-4818-8191-b42c9123e879_print.jpg",
                    "image_date": "2018-07-10T16:00:00.000Z",
                    "person_id": 2,
                    "activity_id": 699,
                    "image_caption": "สอนบทเรียนในด้านการพัฒนาความสัมพันธ์ในครอบครัวและสังคมโดยจัดกิจกรรมให้พวกเขาร่วมกันหาวิธีแก้ไขปัญหา\n\n",
                    "image_caption_govt": "โครงการ Jojo's sanctuary ",
                    "activity_name": "[th]Building Family Dreams",
                    "activity_name_govt": "[th]Family Strengthening Programs",
                    "activity_description": "[th]Run a family strengthening program entitled Building Family Dreams with families currently or at risk of separation due to poverty",
                    "activity_description_govt": "[th]Run a family strengthening program entitled Building Family Dreams with families currently or at risk of separation due to poverty",
                    "activity_start_date": "2018-01-30T16:00:00.000Z",
                    "activity_end_date": "2019-08-29T16:00:00.000Z",
                    "project_id": "JoJo",
                    "project_name": "Jojos Sanctuary"
                },
                {
                    "image_id": 6157,
                    "image_file_name": "445_6157_d35cf4a2-8c7d-4a2e-b7b1-6e5b15b84c0e_print.jpg",
                    "image_date": "2018-06-13T16:00:00.000Z",
                    "person_id": 2,
                    "activity_id": 445,
                    "image_caption": "พูดแบ่งปันการทำงานที่ประเทศใทยให้กับผู้สนับสนุนชาวอเมริกา",
                    "image_caption_govt": "รัฐวอชิงตัน ประเทศสหรัฐอเมริกา",
                    "activity_name": "หาทุนสนับสนุนสำหรับโครงการ",
                    "activity_name_govt": "หาทุนสนับสนุนสำหรับโครงการ",
                    "activity_description": "พบเจอกับผู้สนับสนุนเพื่อหาทุนสนับสนุนสำหรับโครงการและการเปิดศูนย์พักพิงของโครงการในปี 2562",
                    "activity_description_govt": "พบเจอกับผู้สนับสนุนเพื่อหาทุนสนับสนุนสำหรับโครงการและการเปิดศูนย์พักพิงของโครงการในปี 2562",
                    "activity_start_date": "2017-03-08T16:00:00.000Z",
                    "activity_end_date": "2017-06-08T16:00:00.000Z",
                    "project_id": "JoJo",
                    "project_name": "Jojos Sanctuary"
                }
            ]
        }));

    }

};

var target = proxyquire('../../api/controllers/DocxTemplateController.js', {
    'fcf_activities/api/controllers/RenderReportController.js': mockRenderReportController
});

describe('FCF activity image list testing', () => {

    // Mock req
    var req = {
        param: function (name) {

            switch (name) {
                case 'Member name':
                    // return "MEMBER";
                    return null;
                case 'Start date':
                    return new Date("2018-01-01T00:00:00.000Z");
                case 'End date':
                    return new Date("2019-01-01T00:00:00.000Z");
                case 'Project':
                    // return "PROJECT";
                    return null;
            }

        }
    };


    // Mock res
    var res = {
        set: function (obj) {

        },

        send: function (buffer) {

            fs.writeFile("./test_result.docx", buffer, "binary", function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("The file was saved!");
                }
            });

        }
    };

    it('export DOCX report file', () => {

        target.activity_image_list(req, res, {
            imagePath: "./test_images/"
        });

    });

});