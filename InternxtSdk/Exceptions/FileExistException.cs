namespace InternxtSdk.Exceptions;

public class FileExistException : Exception
{
    public FileExistException() : base("File already exists")
    {
    }
    
    public FileExistException(string message) : base(message)
    {
    }
}