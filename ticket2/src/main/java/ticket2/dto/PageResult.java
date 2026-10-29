package ticket2.dto;
import java.util.List;
public record PageResult<T>(List<T> content,int page,int size,long totalElements) {
    public static <T> PageResult<T> of(List<T> values,int page,int size) {
        int safePage=Math.max(0,page), safeSize=Math.max(1,Math.min(100,size));
        return new PageResult<>(values.stream().skip((long)safePage*safeSize).limit(safeSize).toList(),safePage,safeSize,values.size());
    }
}
