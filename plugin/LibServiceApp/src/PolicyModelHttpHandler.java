import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.Charset;

abstract public class PolicyModelHttpHandler implements HttpHandler {

    public abstract String handleGetRequest(String params) throws Exception;

    public abstract String handlePostRequest(String params);


    @Override
    public void handle(HttpExchange httpExchange) throws IOException {
        String response = null;
        try {
            String httpReqMethod = httpExchange.getRequestMethod();
            String requestParams = getRequestParams(httpExchange);

            if ("GET".equals(httpReqMethod)) {
                response = handleGetRequest(requestParams);
            } else if ("POST".equals(httpReqMethod)) {
                String reqBody = getRequestBody(httpExchange);
                response = handlePostRequest(reqBody);
            }


        }catch (Exception e){
           response= e.toString();
        }
        OutputStream outputStream = httpExchange.getResponseBody();
        httpExchange.sendResponseHeaders(200, response.length());
        outputStream.write(response.getBytes());
        outputStream.flush();
        outputStream.close();

    }

    private String getRequestParams(HttpExchange httpExchange) {
        String params=null;
        String request = httpExchange.
                getRequestURI()
                .toString();
        String[] splittedRequestString = request.split("\\?");
        boolean hasAdditionalParams = splittedRequestString.length >1;
        if(hasAdditionalParams)
            params = splittedRequestString[1];
        return params;

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