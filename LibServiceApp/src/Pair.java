public class Pair<T,K> {

    private T a;
    private K b;

    public Pair(T a, K b) {
        this.a = a;
        this.b = b;
    }

    public T getFirst() {
        return a;
    }

    public K getSecond() {
        return b;
    }
}
