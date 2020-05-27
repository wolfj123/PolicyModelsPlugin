import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.Charset;
import java.util.LinkedHashMap;
import java.util.Map;

abstract public class PolicyModelHttpHandler implements HttpHandler {

    public abstract String handleGetRequest(Map<String, String> params) throws Exception;

    public abstract Pair<Integer, String> handlePostRequest(String body);


    @Override
    public void handle(HttpExchange httpExchange) throws IOException {
        int responseCode = 200;
        String response = null;
        try {
            String httpReqMethod = httpExchange.getRequestMethod();
            if ("GET".equals(httpReqMethod)) {
                Map<String, String> requestParams = getRequestParams(httpExchange);
                response = handleGetRequest(requestParams);
            } else if ("POST".equals(httpReqMethod)) {
                String reqBody = getRequestBody(httpExchange);
                Pair<Integer,String> ans = handlePostRequest(reqBody);
                response = (ans != null) ? ans.getSecond() : null;
                responseCode = (ans != null) ? ans.getFirst() : 200;
            }

        }catch (Exception e){
           response= e.toString();
        }

        OutputStream outputStream = httpExchange.getResponseBody();
        httpExchange.sendResponseHeaders(responseCode, response.length());
        outputStream.write(response.getBytes());
        outputStream.flush();
        outputStream.close();

    }

    private  Map<String, String> getRequestParams(HttpExchange httpExchange) {
        Map<String, String> params=null;
        String request = httpExchange.
                getRequestURI()
                .toString();
        String[] splittedRequestString = request.split("\\?");
        boolean hasAdditionalParams = splittedRequestString.length >1;
        if(hasAdditionalParams)
            params = splitQuery(splittedRequestString[1]);
        return params;

    }

    private Map<String, String> splitQuery(String query) {
        Map<String, String> query_pairs = new LinkedHashMap<String, String>();
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            query_pairs.put(pair.substring(0, idx), pair.substring(idx + 1));
        }
        return query_pairs;
    }

    private String getRequestBody(HttpExchange httpExchange) throws IOException {
        InputStream is = httpExchange.getRequestBody();
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buffer = new byte[2048];
        int len;
        while ((len = is.read(buffer)) > 0) {
            bos.write(buffer, 0, len);
        }
        bos.close();
        String body = new String(bos.toByteArray(), Charset.forName("UTF-8"));
        return body;
    }
}