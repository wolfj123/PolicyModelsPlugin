import java.net.URLDecoder;
import java.util.Map;

public class VisualizeDGHandler extends PolicyModelHttpHandler {
    @Override
    public String handleGetRequest(Map<String, String> params) throws Exception {
        String outputPath = params.get("outputPath");
        String dotPath = params.get("dotPath");
        dotPath = URLDecoder.decode(dotPath, "utf-8");
        outputPath = URLDecoder.decode(outputPath, "utf-8");
        return PolicyModelService.visualizeDG(outputPath, dotPath);
    }

    @Override
    public Pair<Integer, String> handlePostRequest(String body) {
        return null;
    }

}
