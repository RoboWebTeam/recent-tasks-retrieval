import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Ловит ошибки рендеринга во всём дереве компонентов и показывает понятный экран
 * вместо «белого экрана смерти». Без этого любая ошибка в компоненте (например при
 * работе с очень большим сгенерированным HTML) обрушивает весь интерфейс в пустоту.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Логируем в консоль — попадёт в мониторинг фронтенда
    console.error('ErrorBoundary caught an error:', error);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isRu = typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ru');
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-background px-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground mb-1">
              {isRu ? 'Что-то пошло не так' : 'Something went wrong'}
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm">
              {isRu
                ? 'Произошла непредвиденная ошибка. Ваша работа сохранена — просто перезагрузите страницу.'
                : 'An unexpected error occurred. Your work is saved — just reload the page.'}
            </p>
          </div>
          <button
            onClick={this.handleReload}
            className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            {isRu ? 'Перезагрузить' : 'Reload'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
