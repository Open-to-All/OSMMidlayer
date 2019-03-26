export const headers = new Headers(
    {
        'Content-Type': 'text/xml; charset=utf-8',
        'Authorization': 'Basic ' + btoa('nthnll@uw.edu:fqXD89cHhg8LARZB')
        //AC: we should use our OAuth server for this purpose.
    }
);

export const defaultTags = "<tag k=\"project\" v=\"opensidewalks\"/>";

export const endpoint = 'https://master.apis.dev.openstreetmap.org/api/0.6/';
// export const endpoint =  'https://api.openstreetmap.org/api/0.6/';