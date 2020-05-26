import org.parboiled.common.Tuple2;

import java.util.Map;

public class VisualizeDGHandler extends PolicyModelHttpHandler {
    @Override
    public String handleGetRequest(Map<String, String> params) throws Exception {
        String outputPath = params.get("outputPath");
        String dotPath = params.get("dotPath");
        PolicyModelService.visualizeDG(outputPath, dotPath);
        return "true";
    }

    @Override
    public Tuple2<Integer, String> handlePostRequest(String body) {
        return null;
    }

}
